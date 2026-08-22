import { z } from "zod";
import { DIGEST_MAX_OUTPUT_TOKENS, DIGEST_MIN_OUTPUT_TOKENS } from "../../config/constants.js";

export const queryRequestSchema = z.object({
  question: z.string().trim().min(1, "question must not be empty").max(2000),
});

export const digestRequestSchema = z.object({
  topic: z.string().trim().max(500).optional(),
  // Spend control: caps how many tokens the composer model may generate for this email.
  maxOutputTokens: z.coerce
    .number()
    .int()
    .min(DIGEST_MIN_OUTPUT_TOKENS, `maxOutputTokens must be at least ${DIGEST_MIN_OUTPUT_TOKENS}`)
    .max(DIGEST_MAX_OUTPUT_TOKENS, `maxOutputTokens must be at most ${DIGEST_MAX_OUTPUT_TOKENS}`)
    .optional(),
});
