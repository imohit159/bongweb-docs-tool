import { auth } from "@/server/auth";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: ["/", "/brand", "/icon.svg"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/me).*)"],
};
