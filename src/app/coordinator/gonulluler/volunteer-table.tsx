"use client";

import { DataTable, type Row } from "@/components/ui/data-table";

export function VolunteerTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      columns={[
        { key: "code", label: "Kod" },
        { key: "name", label: "Ad Soyad" },
        { key: "city", label: "İl" },
        { key: "phone", label: "Telefon" },
        { key: "phoneStatus", label: "Telefon Durumu", type: "badge" },
        { key: "enrollments", label: "Kayıt" },
        { key: "certificates", label: "Sertifika" },
        { key: "status", label: "Durum", type: "badge" },
      ]}
      rows={rows}
      pageSize={10}
    />
  );
}
