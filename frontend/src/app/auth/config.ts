import { z } from "zod";

const configSchema = z.object({
  projectId: z.string().default(""),
  jwksUrl: z.string().default(""),
  publishableClientKey: z.string().default(""),
  handlerUrl: z.string().default("auth"),
});

type StackAuthExtensionConfig = z.infer<typeof configSchema>;

// This is set by vite.config.ts
declare const __STACK_AUTH_CONFIG__: string;

// --- FIX: Defensive Coding ---
let rawConfig = {};

try {
  // We check 'typeof' to prevent ReferenceError if the variable is missing
  if (typeof __STACK_AUTH_CONFIG__ !== "undefined") {
    // We check if it is a valid string before parsing
    const parsed = JSON.parse(__STACK_AUTH_CONFIG__);
    // We ensure it is not null
    if (parsed) {
        rawConfig = parsed;
    }
  }
} catch (error) {
  console.warn("Auth config issue, using defaults.");
}

export const config: StackAuthExtensionConfig = configSchema.parse(rawConfig);
