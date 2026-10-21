import assert from "node:assert/strict";
import test from "node:test";
import { createContactSchema } from "../src/modules/growth-hub/sales/contacts/schemas.js";
import { createLeadSchema } from "../src/modules/growth-hub/sales/leads/schemas.js";
import {
  createTaskSchema,
  timeEntryCreateSchema,
} from "../src/modules/growth-hub/sales/tasks/schemas.js";

test("lead creation requires names, validates email and rejects unknown properties", () => {
  const validLead = {
    firstName: "Avery",
    lastName: "Morgan",
    email: "avery@example.com",
  };
  assert.equal(createLeadSchema.safeParse(validLead).success, true);
  assert.equal(createLeadSchema.safeParse({ ...validLead, email: "not-an-email" }).success, false);
  assert.equal(createLeadSchema.safeParse({ ...validLead, isAdmin: true }).success, false);
  assert.equal(createLeadSchema.safeParse({ ...validLead, score: 101 }).success, false);
  assert.equal(
    createLeadSchema.safeParse({ ...validLead, estimatedDealValue: 12.34 }).success,
    true,
  );
  assert.equal(
    createLeadSchema.safeParse({ ...validLead, estimatedDealValue: 12.345 }).success,
    false,
  );
  assert.equal(
    createLeadSchema.safeParse({ ...validLead, estimatedDealValue: 10_000_000_000 }).success,
    false,
  );
});

test("contact satisfaction is constrained to the documented 0–100 range", () => {
  const contact = { firstName: "Riley", lastName: "Jordan", satisfactionScore: 100 };
  assert.equal(createContactSchema.safeParse(contact).success, true);
  assert.equal(createContactSchema.safeParse({ ...contact, satisfactionScore: 101 }).success, false);
});

test("task validation bounds progress and prevents duplicate relationships or tags", () => {
  const task = {
    title: "Schedule a call",
    progress: 100,
    leadIds: ["00000000-0000-4000-8000-000000000001"],
    tags: ["follow-up"],
  };
  assert.equal(createTaskSchema.safeParse(task).success, true);
  assert.equal(createTaskSchema.safeParse({ ...task, progress: 101 }).success, false);
  assert.equal(
    createTaskSchema.safeParse({ ...task, tags: ["follow-up", "FOLLOW-UP"] }).success,
    false,
  );
  assert.equal(
    createTaskSchema.safeParse({ ...task, leadIds: [...task.leadIds, ...task.leadIds] }).success,
    false,
  );
});

test("time-entry creation rejects end times before start times", () => {
  const valid = {
    startedAt: "2026-10-21T09:00:00Z",
    endedAt: "2026-10-21T10:00:00Z",
    durationMinutes: 60,
  };
  assert.equal(timeEntryCreateSchema.safeParse(valid).success, true);
  assert.equal(
    timeEntryCreateSchema.safeParse({
      ...valid,
      endedAt: "2026-10-21T08:59:00Z",
    }).success,
    false,
  );
  assert.equal(timeEntryCreateSchema.safeParse({ ...valid, durationMinutes: -1 }).success, false);
});
