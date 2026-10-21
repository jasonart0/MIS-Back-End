import { z } from "zod";
import {
  decimalValueSchema,
  paginationSchema,
  uuidSchema,
} from "../../../../core/http/schemas.js";

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalId = uuidSchema.nullable().optional();

export const contactIdSchema = z.object({ id: uuidSchema }).strict();
export const listContactsSchema = paginationSchema.extend({
  status: z.string().trim().min(1).max(32).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

export const createContactSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.email().nullable().optional(),
    phone: nullableText(40),
    companyName: nullableText(200),
    position: nullableText(150),
    industry: nullableText(100),
    status: z.string().trim().min(1).max(32).optional(),
    accountManagerId: optionalId,
    satisfactionScore: z.number().int().min(0).max(100).nullable().optional(),
    dealValue: decimalValueSchema.nullable().optional(),
    notes: nullableText(5000),
  })
  .strict();

export const updateContactSchema = createContactSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const createContactActivitySchema = z
  .object({
    activityType: z.string().trim().min(1).max(64),
    description: z.string().trim().min(1).max(5000),
  })
  .strict();
