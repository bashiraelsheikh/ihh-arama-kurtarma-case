"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  if (submitted) {
    return (
      <div role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 ring-1 ring-green-200">
        Eğer <strong>{email}</strong> adresi sistemde kayıtlıysa, şifre sıfırlama talimatları bu adrese
        gönderilmiştir. Lütfen e-posta kutunuzu kontrol edin.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@mail.com"
        />
      </div>
      <Button type="submit" className="w-full">
        Sıfırlama Bağlantısı Gönder
      </Button>
    </form>
  );
}
