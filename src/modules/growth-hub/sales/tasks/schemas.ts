import { z } from "zod";
import { paginationSchema, uuidSchema } from "../../../../core/http/schemas.js";

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalId = uuidSchema.nullable().optional();
const dateTime = z.iso.datetime({ offset: true });

export const taskIdSchema = z.object({ id: uuidSchema }).strict();
export const taskItemIdSchema = z
  .object({ id: uuidSchema, itemId: uuidSchema })
  .strict();
export const listTasksSchema = paginationSchema.extend({
  status: z.string().trim().min(1).max(32).optional(),
  assigneeId: uuidSchema.optional(),
  leadId: uuidSchema.optional(),
});

const taskFieldsSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    leadId: uuidSchema,
    description: nullableText(5000),
    status: z.string().trim().min(1).max(32).optional(),
    priority: z.string().trim().min(1).max(32).optional(),
    assigneeId: optionalId,
    dueDate: dateTime.nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    parentTaskId: optionalId,
    tags: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
  })
  .strict();

const taskTagsAreUnique = (value: { tags?: string[] }) =>
  (value.tags === undefined ||
    new Set(value.tags.map((tag) => tag.toLocaleLowerCase("en-US"))).size === value.tags.length);

export const createTaskSchema = taskFieldsSchema.refine(taskTagsAreUnique, {
  message: "Task tags must be unique.",
});
export const createSubtaskSchema = taskFieldsSchema
  .omit({ parentTaskId: true, leadId: true })
  .refine(taskTagsAreUnique, { message: "Task tags must be unique." });
export const updateTaskSchema = taskFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.")
  .refine(taskTagsAreUnique, { message: "Task tags must be unique." });

export const checklistCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(250),
    position: z.number().int().min(0).max(100000).optional(),
  })
  .strict();
export const checklistUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(250).optional(),
    isCompleted: z.boolean().optional(),
    position: z.number().int().min(0).max(100000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const commentCreateSchema = z
  .object({ content: z.string().trim().min(1).max(10000) })
  .strict();
export const commentUpdateSchema = commentCreateSchema;

export const attachmentCreateSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(127),
    fileSize: z.number().int().min(0).max(2147483647),
    storageKey: z.string().trim().min(1).max(1024),
  })
  .strict();
export const attachmentUpdateSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255).optional(),
    mimeType: z.string().trim().min(1).max(127).optional(),
    fileSize: z.number().int().min(0).max(2147483647).optional(),
    storageKey: z.string().trim().min(1).max(1024).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const timeEntryCreateSchema = z
  .object({
    startedAt: dateTime,
    endedAt: dateTime.optional(),
    durationMinutes: z.number().int().min(0).max(2147483647).nullable().optional(),
    description: nullableText(2000),
  })
  .strict()
  .refine(
    (value) =>
      value.endedAt === undefined || new Date(value.endedAt) >= new Date(value.startedAt),
    { path: ["endedAt"], message: "End time must not be earlier than start time." },
  );

export const timeEntryUpdateSchema = z
  .object({
    startedAt: dateTime.optional(),
    endedAt: dateTime.nullable().optional(),
    durationMinutes: z.number().int().min(0).max(2147483647).nullable().optional(),
    description: nullableText(2000),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const taskTagsSchema = z
  .object({ tags: z.array(z.string().trim().min(1).max(64)).max(50) })
  .strict()
  .refine((value) => new Set(value.tags).size === value.tags.length, "Tags must be unique.");
