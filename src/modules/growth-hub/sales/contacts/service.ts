import { Prisma } from "@prisma/client";
import { prisma } from "../../../../core/database/prisma.js";
import { HttpError } from "../../../../core/http/errors.js";

const contactSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  companyName: true,
  position: true,
  industry: true,
  status: true,
  accountManagerId: true,
  satisfactionScore: true,
  dealValue: true,
  originatingLeadId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SalesContactSelect;

export async function listContacts(input: {
  page: number;
  pageSize: number;
  status?: string;
  q?: string;
}) {
  const where: Prisma.SalesContactWhereInput = {
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
    prisma.salesContact.findMany({
      where,
      select: contactSelect,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.salesContact.count({ where }),
  ]);
  return { data, total };
}

export async function getContact(id: string) {
  const contact = await prisma.salesContact.findUnique({
    where: { id },
    select: {
      ...contactSelect,
      activities: { orderBy: { createdAt: "desc" } },
      originatingLead: {
        select: { id: true, firstName: true, lastName: true, conversionStatus: true },
      },
      tasks: { include: { task: { select: { id: true, title: true, status: true } } } },
    },
  });
  if (!contact) throw new HttpError(404, "not_found", "Contact was not found.");
  return contact;
}

export async function createContact(input: Prisma.SalesContactCreateInput) {
  return prisma.salesContact.create({ data: input, select: contactSelect });
}

export async function updateContact(id: string, input: Prisma.SalesContactUpdateInput) {
  const result = await prisma.salesContact.updateMany({ where: { id }, data: input });
  if (result.count === 0) throw new HttpError(404, "not_found", "Contact was not found.");
  return prisma.salesContact.findUniqueOrThrow({ where: { id }, select: contactSelect });
}

export async function deleteContact(id: string) {
  const contact = await prisma.salesContact.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { activities: true, tasks: true, conversionRecords: true } },
      originatingLeadId: true,
    },
  });
  if (!contact) throw new HttpError(404, "not_found", "Contact was not found.");
  if (
    contact._count.activities > 0 ||
    contact._count.tasks > 0 ||
    contact._count.conversionRecords > 0 ||
    contact.originatingLeadId
  ) {
    throw new HttpError(
      409,
      "contact_has_relationships",
      "Contact cannot be deleted while it has activities, conversions, tasks, or an originating lead.",
    );
  }
  await prisma.salesContact.delete({ where: { id } });
}

export async function listContactActivities(id: string) {
  const contact = await prisma.salesContact.findUnique({ where: { id }, select: { id: true } });
  if (!contact) throw new HttpError(404, "not_found", "Contact was not found.");
  return prisma.contactActivity.findMany({
    where: { contactId: id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createContactActivity(
  id: string,
  input: { activityType: string; description: string },
) {
  const contact = await prisma.salesContact.findUnique({ where: { id }, select: { id: true } });
  if (!contact) throw new HttpError(404, "not_found", "Contact was not found.");
  return prisma.contactActivity.create({ data: { ...input, contactId: id } });
}
