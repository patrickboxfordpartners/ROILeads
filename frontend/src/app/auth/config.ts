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

// --- FIX: Defensive coding to prevent crashes ---
let rawConfig = {};

try {
  // 1. Check if the variable exists (typeof check prevents ReferenceError)
  // 2. Check if it's not null
  if (typeof __STACK_AUTH_CONFIG__ !== "undefined" && __STACK_AUTH_CONFIG__) {
    rawConfig = JSON.parse(__STACK_AUTH_CONFIG__) || {};
  }
} catch (error) {
  // If anything goes wrong, we just log a warning and use the default {}
  console.warn("Auth config could not be parsed, using defaults.");
}

export const config: StackAuthExtensionConfig = configSchema.parse(rawConfig);
// ------------------------------------------------
