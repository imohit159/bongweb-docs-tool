import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().refine((value) => ["postgresql:", "postgres:"].includes(new URL(value).protocol)),
});
const authEnvSchema = z.object({
  NEON_AUTH_BASE_URL: z.url().refine((value) => new URL(value).protocol === "https:"),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
});

export function getServerEnv() {
  const result = envSchema.safeParse({ DATABASE_URL: process.env.DATABASE_URL });
  if (!result.success) throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  return result.data;
}

export function getAuthEnv() {
  const result = authEnvSchema.safeParse({
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
  });
  if (!result.success)
    throw new Error(
      "Configure a valid NEON_AUTH_BASE_URL and a NEON_AUTH_COOKIE_SECRET of at least 32 characters.",
    );
  return result.data;
}
