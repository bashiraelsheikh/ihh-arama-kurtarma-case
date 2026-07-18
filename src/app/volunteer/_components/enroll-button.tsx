"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import { apiPost } from "@/lib/client-api";

export function EnrollButton({ trainingId }: { trainingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function enroll() {
    setLoading(true);
    setError(null);
    const res = await apiPost("/api/volunteer/enroll", { trainingId });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh(); // sayfa yenilemeden veriyi güncelle
    } else {
      setError(res.error ?? "İşlem başarısız.");
    }
  }

  if (done) {
    return <span className="text-xs font-medium text-green-600">Kayıt alındı ✓</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={enroll} disabled={loading}>
        {loading ? <Spinner /> : null}
        Kayıt Ol
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
