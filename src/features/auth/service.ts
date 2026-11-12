import "server-only";

import { auth } from "@/server/auth";

export async function getCurrentUser() {
  const { data, error } = await auth.getSession();
  if (error) throw new Error("Unable to verify your session. Please try again.");
  if (!data?.user) return null;
  const { id, name, email, emailVerified } = data.user;
  return { id, name, email, emailVerified };
}
