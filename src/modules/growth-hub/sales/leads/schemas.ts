import { z } from "zod";
import {
  decimalValueSchema,
  paginationSchema,
  uuidSchema,
} from "../../../../core/http/schemas.js";

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalId = uuidSchema.nullable().optional();

export const leadIdSchema = z.object({ id: uuidSchema }).strict();
export const listLeadsSchema = paginationSchema.extend({
  status: z.string().trim().min(1).max(32).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

export const createLeadSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.email().nullable().optional(),
    phone: nullableText(40),
    companyName: nullableText(200),
    industry: nullableText(150),
    position: nullableText(150),
    source: nullableText(100),
    ownerId: optionalId,
    status: z.string().trim().min(1).max(32).optional(),
    score: z.number().int().min(0).max(100).nullable().optional(),
    winProbability: z.number().int().min(0).max(100).optional(),
    estimatedDealValue: decimalValueSchema.nullable().optional(),
    nextAction: nullableText(500),
    lastContactAt: z.iso.datetime({ offset: true }).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
    notes: nullableText(5000),
  })
  .strict();

export const updateLeadSchema = createLeadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const createLeadActivitySchema = z
  .object({
    activityType: z.string().trim().min(1).max(64),
    description: z.string().trim().min(1).max(5000),
  })
  .strict();
