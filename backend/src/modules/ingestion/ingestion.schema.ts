import { z } from "zod";
import { MAX_NOTE_LENGTH, MIN_CONTENT_LENGTH } from "../../config/constants.js";

export const ingestRequestSchema = z.object({
  type: z.enum(["note", "url"], {
    errorMap: () => ({ message: 'type must be "note" or "url"' }),
  }),
  content: z
    .string()
    .min(MIN_CONTENT_LENGTH, "content must not be empty")
    .max(MAX_NOTE_LENGTH, `content must be under ${MAX_NOTE_LENGTH} characters`),
  title: z.string().trim().max(200).optional(),
});

export type IngestRequest = z.infer<typeof ingestRequestSchema>;
