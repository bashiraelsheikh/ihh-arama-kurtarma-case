"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/actions/auth";
import { Button, Input, Label, Spinner } from "@/components/ui";

const initial: ActionResult = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </div>
      )}
      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="ornek@mail.com" required />
      </div>
      <div>
        <Label htmlFor="password">Şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        Giriş Yap
      </Button>
    </form>
  );
}
