"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Spinner } from "@/components/ui";
import { apiPost } from "@/lib/client-api";

export function OperationResponse({
  assignmentId,
  invitationStatus,
  operationActive,
}: {
  assignmentId: string;
  invitationStatus: "INVITED" | "ACCEPTED" | "DECLINED";
  operationActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(response: "ACCEPTED" | "DECLINED") {
    setLoading(response);
    setError(null);
    const res = await apiPost("/api/volunteer/operations", { assignmentId, response });
    setLoading(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "İşlem başarısız.");
  }

  if (invitationStatus === "ACCEPTED") return <Badge tone="green">Katılacağım</Badge>;
  if (invitationStatus === "DECLINED") return <Badge tone="red">Katılamayacağım</Badge>;
  if (!operationActive) return <Badge tone="gray">Yanıt verilmedi</Badge>;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => respond("ACCEPTED")} disabled={loading !== null}>
          {loading === "ACCEPTED" ? <Spinner /> : null}Katılacağım
        </Button>
        <Button size="sm" variant="outline" onClick={() => respond("DECLINED")} disabled={loading !== null}>
          {loading === "DECLINED" ? <Spinner /> : null}Katılamam
        </Button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
