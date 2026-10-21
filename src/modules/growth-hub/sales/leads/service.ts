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
  position: true,
  source: true,
  ownerId: true,
  status: true,
  approvalStatus: true,
  conversionStatus: true,
  score: true,
  estimatedDealValue: true,
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
      conversions: { orderBy: { createdAt: "desc" }, include: { resultingContact: true } },
      originatedContact: true,
      tasks: { include: { task: { select: { id: true, title: true, status: true } } } },
    },
  });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  return lead;
}

export async function createLead(input: Prisma.LeadCreateInput) {
  return prisma.lead.create({ data: input, select: leadSelect });
}

export async function updateLead(id: string, input: Prisma.LeadUpdateInput) {
  const result = await prisma.lead.updateMany({ where: { id }, data: input });
  if (result.count === 0) throw new HttpError(404, "not_found", "Lead was not found.");
  return prisma.lead.findUniqueOrThrow({ where: { id }, select: leadSelect });
}

export async function deleteLead(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { conversions: true, activities: true, tasks: true } },
      originatedContact: { select: { id: true } },
    },
  });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  if (
    lead._count.conversions > 0 ||
    lead._count.activities > 0 ||
    lead._count.tasks > 0 ||
    lead.originatedContact
  ) {
    throw new HttpError(
      409,
      "lead_has_relationships",
      "Lead cannot be deleted while it has activities, conversions, contacts, or tasks.",
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

export async function listLeadConversions(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
  return prisma.leadConversion.findMany({
    where: { leadId: id },
    include: { resultingContact: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveLead(id: string, notes?: string | null) {
  return prisma.$transaction(async (transaction) => {
    const lead = await transaction.lead.findUnique({
      where: { id },
      select: { id: true, approvalStatus: true, conversionStatus: true },
    });
    if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");
    if (lead.approvalStatus !== "PENDING" || lead.conversionStatus !== "PENDING") {
      throw new HttpError(409, "lead_not_approvable", "Lead is not awaiting approval.");
    }
    const claimed = await transaction.lead.updateMany({
      where: { id, approvalStatus: "PENDING", conversionStatus: "PENDING" },
      data: { approvalStatus: "APPROVED" },
    });
    if (claimed.count !== 1) {
      throw new HttpError(409, "lead_not_approvable", "Lead approval is already in progress.");
    }
    const approval = await transaction.leadConversion.create({
      data: { leadId: id, conversionStatus: "APPROVED", notes },
    });
    return { leadId: id, approvalStatus: "APPROVED", approval };
  });
}

export async function convertLead(
  id: string,
  input: { contactId?: string; notes?: string | null },
) {
  return prisma.$transaction(
    async (transaction) => {
      const lead = await transaction.lead.findUnique({
        where: { id },
        include: { originatedContact: true },
      });
      if (!lead) throw new HttpError(404, "not_found", "Lead was not found.");

      if (lead.conversionStatus === "CONVERTED") {
        if (input.contactId && lead.originatedContact?.id !== input.contactId) {
          throw new HttpError(
            409,
            "lead_already_converted",
            "Lead has already been converted to a different contact.",
          );
        }
        const conversion = await transaction.leadConversion.findFirst({
          where: { leadId: id, conversionStatus: "CONVERTED" },
          include: { resultingContact: true },
          orderBy: { createdAt: "desc" },
        });
        return {
          lead,
          contact: lead.originatedContact,
          conversion,
          alreadyConverted: true,
        };
      }
      if (lead.approvalStatus !== "APPROVED") {
        throw new HttpError(409, "approval_required", "Lead must be approved before conversion.");
      }

      const claimed = await transaction.lead.updateMany({
        where: { id, approvalStatus: "APPROVED", conversionStatus: "PENDING" },
        data: { conversionStatus: "CONVERTED" },
      });
      if (claimed.count !== 1) {
        throw new HttpError(409, "lead_already_converted", "Lead conversion is already in progress.");
      }

      let contact: Prisma.SalesContactGetPayload<object>;
      if (input.contactId) {
        const existingContact = await transaction.salesContact.findUnique({
          where: { id: input.contactId },
        });
        if (!existingContact) {
          throw new HttpError(404, "not_found", "The requested contact was not found.");
        }
        if (existingContact.originatingLeadId && existingContact.originatingLeadId !== id) {
          throw new HttpError(
            409,
            "contact_already_linked",
            "The contact already originated from a different lead.",
          );
        }
        contact = await transaction.salesContact.update({
          where: { id: input.contactId },
          data: { originatingLeadId: id },
        });
      } else {
        contact = await transaction.salesContact.create({
          data: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            companyName: lead.companyName,
            position: lead.position,
            status: "ACTIVE",
            dealValue: lead.estimatedDealValue ?? undefined,
            originatingLeadId: id,
            notes: lead.notes,
          },
        });
      }

      const conversion = await transaction.leadConversion.create({
        data: {
          leadId: id,
          resultingContactId: contact.id,
          conversionStatus: "CONVERTED",
          notes: input.notes,
        },
      });
      return { lead: { ...lead, conversionStatus: "CONVERTED" }, contact, conversion };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
