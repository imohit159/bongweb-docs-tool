import "server-only";

import { createNeonAuth } from "@neon/auth/next/server";
import { getAuthEnv } from "@/server/config/env";

const env = getAuthEnv();

export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: { secret: env.NEON_AUTH_COOKIE_SECRET },
});
