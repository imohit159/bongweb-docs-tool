import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getServerEnv } from "@/server/config/env";
import * as schema from "./schema";

// neon-http: each query is one HTTP round trip. Multi-statement atomic writes
// must use a single SQL statement or db.batch() (runs in one transaction).
export const db = drizzle({ client: neon(getServerEnv().DATABASE_URL), schema });
export type Db = typeof db;
