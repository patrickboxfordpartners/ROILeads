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

// --- FIX: defensive coding to prevent ReferenceError crash ---
let rawConfig = {};

try {
  // We use 'typeof' because it does not crash if the variable is missing entirely
  if (typeof __STACK_AUTH_CONFIG__ !== "undefined") {
    rawConfig = JSON.parse(__STACK_AUTH_CONFIG__) || {};
  }
} catch (error) {
  console.warn("Auth config could not be parsed, using defaults.");
}

export const config: StackAuthExtensionConfig = configSchema.parse(rawConfig);
// -----------------------------------------------------------
