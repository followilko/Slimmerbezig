import { z } from "zod"

/**
 * Server-only env — never import this from client components.
 * Public keys stay in {@link ./env.ts}.
 *
 * `OPENAI_API_KEY` is optional at module load so `next build` succeeds without it;
 * Route Handlers validate before calling the model.
 */
const serverSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional().default(""),
  /** When true, AI tools skip Supabase writes (local demo without `ai_chat_schema`). */
  AI_CHAT_STUB_TOOLS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
})

export const envServer = serverSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_CHAT_STUB_TOOLS: process.env.AI_CHAT_STUB_TOOLS,
})
