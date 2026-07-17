"use client";

import { useState } from "react";
import { Button, Input, Label, Spinner } from "@/components/ui";
import { apiPost } from "@/lib/client-api";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const data = new FormData(form);
    const res = await apiPost("/api/account/password", {
      currentPassword: data.get("currentPassword"),
      newPassword: data.get("newPassword"),
      newPasswordConfirm: data.get("newPasswordConfirm"),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      form.reset();
    } else {
      setError(res.fieldErrors?.newPasswordConfirm ?? res.fieldErrors?.newPassword ?? res.error ?? "İşlem başarısız.");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">
          Şifreniz başarıyla güncellendi.
        </div>
      )}
      <div>
        <Label htmlFor="currentPassword">Mevcut Şifre</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">Yeni Şifre</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="newPasswordConfirm">Yeni Şifre Tekrarı</Label>
        <Input id="newPasswordConfirm" name="newPasswordConfirm" type="password" required />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Spinner /> : null}
        Şifreyi Güncelle
      </Button>
    </form>
  );
}
