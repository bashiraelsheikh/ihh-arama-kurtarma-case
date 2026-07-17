"use client";

import { DataTable, type Row } from "@/components/ui/data-table";

export function ExamTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      columns={[
        { key: "name", label: "Sınav Adı" },
        { key: "training", label: "Eğitim" },
        { key: "examType", label: "Tür" },
        { key: "examDateStr", label: "Tarih" },
        { key: "location", label: "Yer" },
        { key: "puan", label: "Geçme/Azami" },
        { key: "instructor", label: "Sorumlu Eğitmen" },
        { key: "candidates", label: "Aday" },
      ]}
      rows={rows}
    />
  );
}
