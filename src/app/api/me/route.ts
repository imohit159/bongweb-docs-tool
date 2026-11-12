import { connection } from "next/server";
import { getCurrentUser } from "@/features/auth/service";

export async function GET() {
  await connection();
  try {
    const user = await getCurrentUser();
    return Response.json(user ? { user } : { error: "Unauthorized" }, {
      status: user ? 200 : 401,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Authentication service is unavailable." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
