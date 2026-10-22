import { Prisma } from "@prisma/client";
import { prisma } from "../../../../core/database/prisma.js";
import { HttpError } from "../../../../core/http/errors.js";

const leadSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  companyName: true,
  industry: true,
  position: true,
  source: true,
  ownerId: true,
  status: true,
  score: true,
  winProbability: true,
  estimatedDealValue: true,
  nextAction: true,
  lastContactAt: true,
  tags: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LeadSelect;

export async function listLeads(input: {
  page: number;
  pageSize: number;
  status?: string;
  q?: string;
}) {
  const where: Prisma.LeadWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.q
      ? {
          OR: [
            { firstName: { contains: input.q, mode: "insensitive" } },
            { lastName: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
            { companyName: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      select: leadSelect,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
  return { data, total };
}

export async function getLead(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      ...leadSelect,
      activities: { orderBy: { createdAt: "desc" } },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { tags: { include: { tag: true } } },
      },
    },
  });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  return lead;
}

export async function createLead(input: Prisma.LeadUncheckedCreateInput & { lastContactAt?: string | null }) {
  return prisma.lead.create({
    data: {
      ...input,
      lastContactAt: input.lastContactAt ? new Date(input.lastContactAt) : input.lastContactAt,
    },
    select: leadSelect,
  });
}

export async function updateLead(
  id: string,
  input: Prisma.LeadUncheckedUpdateInput & { lastContactAt?: string | null },
) {
  const data = {
    ...input,
    ...(input.lastContactAt !== undefined
      ? { lastContactAt: input.lastContactAt ? new Date(input.lastContactAt) : null }
      : {}),
  };
  const result = await prisma.lead.updateMany({ where: { id }, data });
  if (result.count === 0) throw new HttpError(404, "not_found", "Lead was not found.");
  return prisma.lead.findUniqueOrThrow({ where: { id }, select: leadSelect });
}

export async function deleteLead(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { activities: true, tasks: true } },
    },
  });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  if (lead._count.activities > 0 || lead._count.tasks > 0) {
    throw new HttpError(
      409,
      "lead_has_relationships",
      "Lead cannot be deleted while it has activities or tasks.",
    );
  }
  await prisma.lead.delete({ where: { id } });
}

export async function listLeadActivities(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  return prisma.leadActivity.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" } });
}

export async function createLeadActivity(
  id: string,
  input: { activityType: string; description: string },
) {
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  return prisma.leadActivity.create({ data: { ...input, leadId: id } });
}
