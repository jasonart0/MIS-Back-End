import { Prisma } from "@prisma/client";
import { prisma } from "../../../../core/database/prisma.js";
import { HttpError } from "../../../../core/http/errors.js";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assigneeId: true,
  creatorId: true,
  dueDate: true,
  progress: true,
  parentTaskId: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SalesTaskSelect;

type Transaction = Prisma.TransactionClient;

async function requireTask(transaction: Transaction, id: string) {
  const task = await transaction.salesTask.findUnique({ where: { id }, select: { id: true } });
  if (!task) throw new HttpError(404, "not_found", "Task was not found.");
}

async function ensureIdsExist(
  transaction: Transaction,
  ids: string[],
  entity: "lead" | "contact",
) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    throw new HttpError(400, "duplicate_relationship", "Relationship IDs must be unique.");
  }
  if (uniqueIds.length === 0) return;
  const found =
    entity === "lead"
      ? await transaction.lead.count({ where: { id: { in: uniqueIds } } })
      : await transaction.salesContact.count({ where: { id: { in: uniqueIds } } });
  if (found !== uniqueIds.length) {
    throw new HttpError(404, "related_record_not_found", `One or more ${entity} IDs were not found.`);
  }
}

async function ensureParentIsSafe(transaction: Transaction, taskId: string | undefined, parentId: string | null) {
  if (!parentId) return;
  if (taskId === parentId) {
    throw new HttpError(400, "invalid_parent", "A task cannot be its own parent.");
  }

  const visited = new Set<string>();
  let currentId: string | null = parentId;
  while (currentId) {
    if (currentId === taskId || visited.has(currentId)) {
      throw new HttpError(409, "task_hierarchy_cycle", "Parent assignment would create a task cycle.");
    }
    visited.add(currentId);
    const parent: { parentTaskId: string | null } | null = await transaction.salesTask.findUnique({
      where: { id: currentId },
      select: { parentTaskId: true },
    });
    if (!parent) throw new HttpError(404, "parent_task_not_found", "Parent task was not found.");
    currentId = parent.parentTaskId;
  }
}

async function ensureTags(transaction: Transaction, inputTags: string[]) {
  const names = inputTags.map((name) => name.trim().toLocaleLowerCase("en-US"));
  if (new Set(names).size !== names.length) {
    throw new HttpError(400, "duplicate_tag", "Task tags must be unique, ignoring case.");
  }
  const tags = [];
  for (const name of names) {
    tags.push(
      await transaction.taskTag.upsert({
        where: { name },
        create: { name },
        update: {},
      }),
    );
  }
  return tags;
}

export async function listTasks(input: {
  page: number;
  pageSize: number;
  status?: string;
  assigneeId?: string;
  leadId?: string;
  contactId?: string;
}) {
  const where: Prisma.SalesTaskWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
    ...(input.leadId ? { leads: { some: { leadId: input.leadId } } } : {}),
    ...(input.contactId ? { contacts: { some: { contactId: input.contactId } } } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.salesTask.findMany({
      where,
      select: {
        ...taskSelect,
        leads: { select: { leadId: true } },
        contacts: { select: { contactId: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.salesTask.count({ where }),
  ]);
  return { data, total };
}

export async function getTask(id: string) {
  const task = await prisma.salesTask.findUnique({
    where: { id },
    select: {
      ...taskSelect,
      subtasks: { select: taskSelect, orderBy: { createdAt: "asc" } },
      checklist: { orderBy: { position: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      timeEntries: { orderBy: { startedAt: "desc" } },
      tags: { include: { tag: true } },
      activities: { orderBy: { createdAt: "desc" } },
      leads: { include: { lead: true } },
      contacts: { include: { contact: true } },
    },
  });
  if (!task) throw new HttpError(404, "not_found", "Task was not found.");
  return task;
}

export async function createTask(input: {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  progress?: number;
  parentTaskId?: string | null;
  leadIds?: string[];
  contactIds?: string[];
  tags?: string[];
}) {
  return prisma.$transaction(
    async (transaction) => {
      await ensureParentIsSafe(transaction, undefined, input.parentTaskId ?? null);
      await ensureIdsExist(transaction, input.leadIds ?? [], "lead");
      await ensureIdsExist(transaction, input.contactIds ?? [], "contact");
      const tags = await ensureTags(transaction, input.tags ?? []);
      const task = await transaction.salesTask.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate,
          progress: input.progress,
          parentTaskId: input.parentTaskId,
        },
      });
      if (input.leadIds?.length) {
        await transaction.salesTaskLead.createMany({
          data: input.leadIds.map((leadId) => ({ taskId: task.id, leadId })),
        });
      }
      if (input.contactIds?.length) {
        await transaction.salesTaskContact.createMany({
          data: input.contactIds.map((contactId) => ({ taskId: task.id, contactId })),
        });
      }
      if (tags.length) {
        await transaction.salesTaskTag.createMany({
          data: tags.map((tag) => ({ taskId: task.id, tagId: tag.id })),
          skipDuplicates: true,
        });
      }
      return transaction.salesTask.findUniqueOrThrow({
        where: { id: task.id },
        select: {
          ...taskSelect,
          leads: { select: { leadId: true } },
          contacts: { select: { contactId: true } },
          tags: { include: { tag: true } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function updateTask(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    progress?: number;
    parentTaskId?: string | null;
    leadIds?: string[];
    contactIds?: string[];
    tags?: string[];
  },
) {
  return prisma.$transaction(
    async (transaction) => {
      const existing = await transaction.salesTask.findUnique({
        where: { id },
        select: { id: true, status: true, parentTaskId: true },
      });
      if (!existing) throw new HttpError(404, "not_found", "Task was not found.");
      if (input.parentTaskId !== undefined) {
        await ensureParentIsSafe(transaction, id, input.parentTaskId);
      }
      if (input.leadIds !== undefined) await ensureIdsExist(transaction, input.leadIds, "lead");
      if (input.contactIds !== undefined) {
        await ensureIdsExist(transaction, input.contactIds, "contact");
      }

      const { leadIds, contactIds, tags: inputTags, ...fields } = input;
      const data: Prisma.SalesTaskUncheckedUpdateInput = {
        ...fields,
        ...(fields.dueDate !== undefined
          ? { dueDate: fields.dueDate ? new Date(fields.dueDate) : null }
          : {}),
        ...(fields.status !== undefined
          ? {
              completedAt:
                fields.status.toUpperCase() === "COMPLETED"
                  ? new Date()
                  : existing.status.toUpperCase() === "COMPLETED"
                    ? null
                    : undefined,
            }
          : {}),
      };
      await transaction.salesTask.update({ where: { id }, data });

      if (leadIds !== undefined) {
        await transaction.salesTaskLead.deleteMany({ where: { taskId: id } });
        if (leadIds.length) {
          await transaction.salesTaskLead.createMany({
            data: leadIds.map((leadId) => ({ taskId: id, leadId })),
          });
        }
      }
      if (contactIds !== undefined) {
        await transaction.salesTaskContact.deleteMany({ where: { taskId: id } });
        if (contactIds.length) {
          await transaction.salesTaskContact.createMany({
            data: contactIds.map((contactId) => ({ taskId: id, contactId })),
          });
        }
      }
      if (inputTags !== undefined) {
        const tags = await ensureTags(transaction, inputTags);
        await transaction.salesTaskTag.deleteMany({ where: { taskId: id } });
        if (tags.length) {
          await transaction.salesTaskTag.createMany({
            data: tags.map((tag) => ({ taskId: id, tagId: tag.id })),
          });
        }
      }

      await transaction.taskActivity.create({
        data: {
          taskId: id,
          activityType: "UPDATED",
          description: `Updated task fields: ${Object.keys(input).join(", ")}.`,
        },
      });
      return transaction.salesTask.findUniqueOrThrow({
        where: { id },
        select: {
          ...taskSelect,
          leads: { select: { leadId: true } },
          contacts: { select: { contactId: true } },
          tags: { include: { tag: true } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function deleteTask(id: string) {
  const task = await prisma.salesTask.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          subtasks: true,
          checklist: true,
          comments: true,
          attachments: true,
          timeEntries: true,
          tags: true,
          activities: true,
          leads: true,
          contacts: true,
        },
      },
    },
  });
  if (!task) throw new HttpError(404, "not_found", "Task was not found.");
  if (Object.values(task._count).some((count) => count > 0)) {
    throw new HttpError(
      409,
      "task_has_relationships",
      "Task cannot be deleted while it has subtasks, activities, or related records.",
    );
  }
  await prisma.salesTask.delete({ where: { id } });
}

export async function listSubtasks(id: string) {
  await requireTask(prisma, id);
  return prisma.salesTask.findMany({
    where: { parentTaskId: id },
    select: taskSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function createSubtask(
  parentId: string,
  input: Omit<Parameters<typeof createTask>[0], "parentTaskId">,
) {
  return createTask({ ...input, parentTaskId: parentId });
}

export async function listChecklist(id: string) {
  await requireTask(prisma, id);
  return prisma.taskChecklistItem.findMany({
    where: { taskId: id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

export async function createChecklistItem(
  taskId: string,
  input: { title: string; position?: number },
) {
  await requireTask(prisma, taskId);
  return prisma.taskChecklistItem.create({ data: { ...input, taskId } });
}

export async function updateChecklistItem(
  taskId: string,
  itemId: string,
  input: { title?: string; isCompleted?: boolean; position?: number },
) {
  const result = await prisma.taskChecklistItem.updateMany({
    where: { id: itemId, taskId },
    data: input,
  });
  if (!result.count) throw new HttpError(404, "not_found", "Checklist item was not found.");
  return prisma.taskChecklistItem.findUniqueOrThrow({ where: { id: itemId } });
}

export async function deleteChecklistItem(taskId: string, itemId: string) {
  const result = await prisma.taskChecklistItem.deleteMany({ where: { id: itemId, taskId } });
  if (!result.count) throw new HttpError(404, "not_found", "Checklist item was not found.");
}

export async function listComments(id: string) {
  await requireTask(prisma, id);
  return prisma.taskComment.findMany({ where: { taskId: id }, orderBy: { createdAt: "asc" } });
}

export async function createComment(taskId: string, content: string) {
  await requireTask(prisma, taskId);
  return prisma.taskComment.create({ data: { taskId, content } });
}

export async function updateComment(taskId: string, itemId: string, content: string) {
  const result = await prisma.taskComment.updateMany({
    where: { id: itemId, taskId },
    data: { content },
  });
  if (!result.count) throw new HttpError(404, "not_found", "Task comment was not found.");
  return prisma.taskComment.findUniqueOrThrow({ where: { id: itemId } });
}

export async function deleteComment(taskId: string, itemId: string) {
  const result = await prisma.taskComment.deleteMany({ where: { id: itemId, taskId } });
  if (!result.count) throw new HttpError(404, "not_found", "Task comment was not found.");
}

export async function listAttachments(id: string) {
  await requireTask(prisma, id);
  return prisma.taskAttachment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAttachment(
  taskId: string,
  input: { fileName: string; mimeType: string; fileSize: number; storageKey: string },
) {
  await requireTask(prisma, taskId);
  return prisma.taskAttachment.create({ data: { ...input, taskId } });
}

export async function updateAttachment(
  taskId: string,
  itemId: string,
  input: { fileName?: string; mimeType?: string; fileSize?: number; storageKey?: string },
) {
  const result = await prisma.taskAttachment.updateMany({
    where: { id: itemId, taskId },
    data: input,
  });
  if (!result.count) throw new HttpError(404, "not_found", "Task attachment was not found.");
  return prisma.taskAttachment.findUniqueOrThrow({ where: { id: itemId } });
}

export async function deleteAttachment(taskId: string, itemId: string) {
  const result = await prisma.taskAttachment.deleteMany({ where: { id: itemId, taskId } });
  if (!result.count) throw new HttpError(404, "not_found", "Task attachment was not found.");
}

export async function listTimeEntries(id: string) {
  await requireTask(prisma, id);
  return prisma.taskTimeEntry.findMany({
    where: { taskId: id },
    orderBy: { startedAt: "desc" },
  });
}

export async function createTimeEntry(
  taskId: string,
  input: {
    startedAt: string;
    endedAt?: string;
    durationMinutes?: number | null;
    description?: string | null;
  },
) {
  await requireTask(prisma, taskId);
  return prisma.taskTimeEntry.create({
    data: {
      taskId,
      startedAt: new Date(input.startedAt),
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      durationMinutes: input.durationMinutes,
      description: input.description,
    },
  });
}

export async function updateTimeEntry(
  taskId: string,
  itemId: string,
  input: {
    startedAt?: string;
    endedAt?: string | null;
    durationMinutes?: number | null;
    description?: string | null;
  },
) {
  const existing = await prisma.taskTimeEntry.findFirst({
    where: { id: itemId, taskId },
  });
  if (!existing) throw new HttpError(404, "not_found", "Task time entry was not found.");
  const start = input.startedAt ? new Date(input.startedAt) : existing.startedAt;
  const end =
    input.endedAt === undefined
      ? existing.endedAt
      : input.endedAt === null
        ? null
        : new Date(input.endedAt);
  if (end && end < start) {
    throw new HttpError(400, "invalid_time_interval", "End time must not be earlier than start time.");
  }
  return prisma.taskTimeEntry.update({
    where: { id: itemId },
    data: {
      ...(input.startedAt !== undefined ? { startedAt: start } : {}),
      ...(input.endedAt !== undefined ? { endedAt: end } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
}

export async function deleteTimeEntry(taskId: string, itemId: string) {
  const result = await prisma.taskTimeEntry.deleteMany({ where: { id: itemId, taskId } });
  if (!result.count) throw new HttpError(404, "not_found", "Task time entry was not found.");
}

export async function listTags(taskId: string) {
  await requireTask(prisma, taskId);
  const associations = await prisma.salesTaskTag.findMany({
    where: { taskId },
    include: { tag: true },
    orderBy: { tag: { name: "asc" } },
  });
  return associations.map(({ tag }) => tag);
}

export async function replaceTags(taskId: string, names: string[]) {
  return prisma.$transaction(async (transaction) => {
    await requireTask(transaction, taskId);
    const tags = await ensureTags(transaction, names);
    await transaction.salesTaskTag.deleteMany({ where: { taskId } });
    if (tags.length) {
      await transaction.salesTaskTag.createMany({
        data: tags.map((tag) => ({ taskId, tagId: tag.id })),
      });
    }
    return tags;
  });
}

export async function replaceRelationships(
  taskId: string,
  leadIds: string[],
  contactIds: string[],
) {
  return prisma.$transaction(async (transaction) => {
    await requireTask(transaction, taskId);
    await ensureIdsExist(transaction, leadIds, "lead");
    await ensureIdsExist(transaction, contactIds, "contact");
    await transaction.salesTaskLead.deleteMany({ where: { taskId } });
    await transaction.salesTaskContact.deleteMany({ where: { taskId } });
    if (leadIds.length) {
      await transaction.salesTaskLead.createMany({
        data: leadIds.map((leadId) => ({ taskId, leadId })),
      });
    }
    if (contactIds.length) {
      await transaction.salesTaskContact.createMany({
        data: contactIds.map((contactId) => ({ taskId, contactId })),
      });
    }
    await transaction.taskActivity.create({
      data: { taskId, activityType: "RELATIONSHIPS_UPDATED", description: "Task relationships updated." },
    });
    return {
      leads: await transaction.salesTaskLead.findMany({ where: { taskId } }),
      contacts: await transaction.salesTaskContact.findMany({ where: { taskId } }),
    };
  });
}

export async function listActivities(taskId: string) {
  await requireTask(prisma, taskId);
  return prisma.taskActivity.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
}
