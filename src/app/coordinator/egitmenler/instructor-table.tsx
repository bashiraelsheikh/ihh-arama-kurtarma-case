"use client";

import { DataTable, type Row } from "@/components/ui/data-table";

export function InstructorTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Ad Soyad" },
        { key: "city", label: "İl" },
        { key: "region", label: "Bölge" },
        { key: "expertise", label: "Uzmanlık" },
        { key: "trainingCount", label: "Eğitim" },
        { key: "participants", label: "Katılımcı" },
        { key: "avgScore", label: "Ort. Puan" },
        { key: "passRate", label: "Başarı" },
        { key: "cancelRate", label: "İptal Oranı" },
      ]}
      rows={rows}
    />
  );
}
