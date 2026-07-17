"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Spinner } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { apiPost } from "@/lib/client-api";

export function PhoneUpdateButton({ currentPhone }: { currentPhone: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(currentPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiPost("/api/volunteer/phone", { phone });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.fieldErrors?.phone ?? res.error ?? "İşlem başarısız.");
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Bilgilerimi Güncelle
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="İletişim Bilgilerini Güncelle" maxWidth="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0555 123 45 67" required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : null}
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
