import { AuthForm } from "@/features/auth/components/auth-form";

export function LoginForm() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your Bongweb workspace.</p>
      </div>
      <AuthForm />
    </>
  );
}
