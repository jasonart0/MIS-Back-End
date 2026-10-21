import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const decimalValueSchema = z
  .number()
  .finite()
  .min(0)
  .max(9_999_999_999.99)
  .refine((value) => Number(value.toFixed(2)) === value, "Value must have at most 2 decimal places.");
export const idParamsSchema = z.object({ id: uuidSchema }).strict();
export const nestedIdParamsSchema = z
  .object({ id: uuidSchema, itemId: uuidSchema })
  .strict();
export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const paginationResponse = (page: number, pageSize: number, total: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
