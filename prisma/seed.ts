import { prisma } from "../src/core/database/prisma.js";
import { env } from "../src/config/env.js";

if (env.NODE_ENV === "production") {
  throw new Error("Sample data cannot be seeded in production.");
}

try {
  const [leads, contacts, tasks] = await prisma.$transaction([
    prisma.lead.createMany({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000101",
          firstName: "Amina",
          lastName: "Khan",
          email: "amina.khan@example.com",
          phone: "+1-555-0101",
          companyName: "Northstar Demo Co",
          position: "Operations Manager",
          source: "Website",
          status: "NEW",
          score: 72,
          estimatedDealValue: "15000.00",
          notes: "SAMPLE DATA - Safe to delete.",
        },
        {
          id: "00000000-0000-4000-8000-000000000102",
          firstName: "Omar",
          lastName: "Reed",
          email: "omar.reed@example.com",
          phone: "+1-555-0102",
          companyName: "Cedar Demo Group",
          position: "Sales Director",
          source: "Referral",
          status: "CONTACTED",
          score: 58,
          estimatedDealValue: "8200.00",
          notes: "SAMPLE DATA - Safe to delete.",
        },
      ],
      skipDuplicates: true,
    }),
    prisma.salesContact.createMany({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000201",
          firstName: "Maya",
          lastName: "Patel",
          email: "maya.patel@example.com",
          phone: "+1-555-0201",
          companyName: "Brightpath Demo Ltd",
          position: "Product Manager",
          industry: "Technology",
          status: "ACTIVE",
          satisfactionScore: 88,
          dealValue: "12400.00",
          notes: "SAMPLE DATA - Safe to delete.",
        },
        {
          id: "00000000-0000-4000-8000-000000000202",
          firstName: "Leo",
          lastName: "Brooks",
          email: "leo.brooks@example.com",
          phone: "+1-555-0202",
          companyName: "Harbor Demo Studio",
          position: "Finance Lead",
          industry: "Professional Services",
          status: "ACTIVE",
          satisfactionScore: 76,
          dealValue: "5600.00",
          notes: "SAMPLE DATA - Safe to delete.",
        },
      ],
      skipDuplicates: true,
    }),
    prisma.salesTask.createMany({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000301",
          title: "SAMPLE - Prepare discovery call",
          description: "Demo task record. Safe to delete.",
          status: "NEW",
          priority: "HIGH",
          dueDate: new Date("2027-01-15T17:00:00.000Z"),
          progress: 0,
        },
        {
          id: "00000000-0000-4000-8000-000000000302",
          title: "SAMPLE - Send product overview",
          description: "Demo task record. Safe to delete.",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          dueDate: new Date("2027-01-20T17:00:00.000Z"),
          progress: 40,
        },
        {
          id: "00000000-0000-4000-8000-000000000303",
          title: "SAMPLE - Follow up on proposal",
          description: "Demo task record. Safe to delete.",
          status: "NEW",
          priority: "LOW",
          dueDate: new Date("2027-01-25T17:00:00.000Z"),
          progress: 0,
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log(
    `Sample data seeded (new rows): ${leads.count} leads, ${contacts.count} contacts, ${tasks.count} tasks.`,
  );
} finally {
  await prisma.$disconnect();
}
