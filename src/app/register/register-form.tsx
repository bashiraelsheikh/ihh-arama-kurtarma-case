"use client";

import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/app/actions/auth";
import { Button, Input, Label, Select, Spinner } from "@/components/ui";

const initial: ActionResult = {};

interface CityOption {
  id: string;
  name: string;
  region: { name: string };
}

export function RegisterForm({ cities }: { cities: CityOption[] }) {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ad" error={fe.firstName}>
          <Input name="firstName" required />
        </Field>
        <Field label="Soyad" error={fe.lastName}>
          <Input name="lastName" required />
        </Field>
      </div>
      <Field label="Kimlik Numarası" error={fe.nationalIdentityNumber}>
        <Input name="nationalIdentityNumber" inputMode="numeric" maxLength={11} placeholder="11 haneli kimlik numarası" required />
      </Field>
      <Field label="E-posta" error={fe.email}>
        <Input name="email" type="email" placeholder="ornek@mail.com" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Şifre" error={fe.password}>
          <Input name="password" type="password" placeholder="En az 8 karakter" required />
        </Field>
        <Field label="Şifre Tekrarı" error={fe.passwordConfirm}>
          <Input name="passwordConfirm" type="password" required />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Telefon Numarası" error={fe.phone}>
          <Input name="phone" placeholder="0555 123 45 67" required />
        </Field>
        <Field label="Bulunduğu İl" error={fe.cityId}>
          <Select name="cityId" defaultValue="" required>
            <option value="" disabled>
              İl seçiniz
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.region.name})
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
          <span>
            Açık rıza metnini ve kullanım koşullarını okudum, kabul ediyorum.
          </span>
        </label>
        {fe.consent && <p className="mt-1 text-xs text-red-600">{fe.consent}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        Kayıt Ol
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
