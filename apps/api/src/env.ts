import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseApiEnv, type ApiEnv } from "@botmate/shared/env";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../.env") });

let cached: ApiEnv | null = null;

/** Validates and caches API environment on first access. */
export function getApiEnv(): ApiEnv {
  if (!cached) {
    cached = parseApiEnv();
  }
  return cached;
}

/** Call before server listen to fail fast on misconfiguration. */
export function validateApiEnv(): ApiEnv {
  return getApiEnv();
}
