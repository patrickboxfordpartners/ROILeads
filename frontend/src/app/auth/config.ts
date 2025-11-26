import { z } from "zod";

const configSchema = z.object({
  projectId: z.string().default(""),
  jwksUrl: z.string().default(""),
  publishableClientKey: z.string().default(""),
  handlerUrl: z.string().default("auth"),
});

type StackAuthExtensionConfig = z.infer<typeof configSchema>;

// --- FIX: Just return empty config ---
const rawConfig = {};

export const config: StackAuthExtensionConfig = configSchema.parse(rawConfig);
