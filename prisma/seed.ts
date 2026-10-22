import { prisma } from "../src/core/database/prisma.js";
import { env } from "../src/config/env.js";

if (env.NODE_ENV === "production") {
  throw new Error("Sample data cannot be seeded in production.");
}

try {
  const leads = await prisma.lead.createMany({
    data: [
      {
        id: "00000000-0000-4000-8000-000000000101",
        firstName: "Amina",
        lastName: "Khan",
        email: "amina.khan@example.com",
        phone: "+1-555-0101",
        companyName: "Northstar Demo Co",
        industry: "Technology",
        position: "Operations Manager",
        source: "Website",
        status: "NEW",
        score: 72,
        winProbability: 64,
        estimatedDealValue: "15000.00",
        nextAction: "Schedule discovery call",
        tags: ["enterprise", "website"],
        notes: "SAMPLE DATA - Safe to delete.",
      },
      {
        id: "00000000-0000-4000-8000-000000000102",
        firstName: "Omar",
        lastName: "Reed",
        email: "omar.reed@example.com",
        phone: "+1-555-0102",
        companyName: "Cedar Demo Group",
        industry: "Professional Services",
        position: "Sales Director",
        source: "Referral",
        status: "QUALIFIED",
        score: 58,
        winProbability: 50,
        estimatedDealValue: "8200.00",
        nextAction: "Send proposal",
        tags: ["referral"],
        notes: "SAMPLE DATA - Safe to delete.",
      },
    ],
    skipDuplicates: true,
  });

  const tasks = await prisma.salesTask.createMany({
    data: [
      {
        id: "00000000-0000-4000-8000-000000000301",
        leadId: "00000000-0000-4000-8000-000000000101",
        title: "SAMPLE - Prepare discovery call",
        description: "Demo task record. Safe to delete.",
        status: "NEW",
        priority: "HIGH",
        dueDate: new Date("2027-01-15T17:00:00.000Z"),
        progress: 0,
      },
      {
        id: "00000000-0000-4000-8000-000000000302",
        leadId: "00000000-0000-4000-8000-000000000102",
        title: "SAMPLE - Send product overview",
        description: "Demo task record. Safe to delete.",
        status: "ACTIVE",
        priority: "MEDIUM",
        dueDate: new Date("2027-01-20T17:00:00.000Z"),
        progress: 40,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Sample data seeded (new rows): ${leads.count} leads, ${tasks.count} lead tasks.`);
} finally {
  await prisma.$disconnect();
}
