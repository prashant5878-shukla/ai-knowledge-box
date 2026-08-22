import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  PORT: z.coerce.number().int().positive().default(4000),
  EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  CHAT_MODEL: z.string().default("gemini-2.5-flash"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017"),
  MONGODB_DB_NAME: z.string().default("knowledge_inbox"),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
