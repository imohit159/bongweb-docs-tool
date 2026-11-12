"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InputGroup, InputField } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { authClient } from "@/features/auth/client";
import { signInSchema } from "@/features/auth/schema";

type FormState = { error?: string };

export function AuthForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const parsed = signInSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form fields." };
      try {
        const result = await authClient.signIn.email(parsed.data);
        if (result.error)
          return { error: result.error.message || "Authentication failed. Please try again." };
        const session = await authClient.getSession();
        if (session.error) return { error: "Could not verify your session. Please try signing in again." };
        if (!session.data?.user)
          return { error: "Could not verify your session. Please try signing in again." };
        router.replace("/proposals");
        router.refresh();
        return {};
      } catch {
        return { error: "Unable to reach authentication. Please try again." };
      }
    },
    {},
  );

  return (
    <form action={action} aria-busy={pending} className="flex flex-col gap-6">
      <InputGroup className="w-full gap-5">
        <InputField
          index={0}
          label="Email"
          aria-label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
          disabled={pending}
        />
        <div className="relative">
          <InputField
            index={1}
            label="Password"
            aria-label="Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            minLength={1}
            maxLength={128}
            required
            disabled={pending}
            className="[&_input]:pr-11"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 bottom-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={pending}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
      </InputGroup>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Please wait…" : "Sign in"}
      </Button>
    </form>
  );
}
