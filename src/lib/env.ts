import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export function env(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function db() {
  return drizzle(env().DB, { schema });
}

export type DB = ReturnType<typeof db>;
