import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.url().startsWith("postgresql://"),
    ALLOW_UNAUTHENTICATED_WRITES: z
      .stringbool()
      .default(false)
      .transform((value) => value),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV === "production" && values.ALLOW_UNAUTHENTICATED_WRITES) {
      context.addIssue({
        code: "custom",
        path: ["ALLOW_UNAUTHENTICATED_WRITES"],
        message: "Unauthenticated writes cannot be enabled in production.",
      });
    }
  });

export const env = envSchema.parse(process.env);
