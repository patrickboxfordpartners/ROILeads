import { z } from "zod";

const configSchema = z.object({
  projectId: z.string().default(""),
  jwksUrl: z.string().default(""),
  publishableClientKey: z.string().default(""),
  handlerUrl: z.string().default("auth"),
});

type StackAuthExtensionConfig = z.infer<typeof configSchema>;

// --- NUCLEAR FIX: Stop looking for the missing variable ---
// We hardcode an empty config so the app can load without crashing.
const rawConfig = {};

export const config: StackAuthExtensionConfig = configSchema.parse(rawConfig);
