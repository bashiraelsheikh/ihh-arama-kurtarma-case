"use client";

import { DataTable, type Row } from "@/components/ui/data-table";
import { trainingStatusLabel } from "@/lib/labels";

interface TrainingRow {
  id: string;
  name: string;
  category: string;
  city: string;
  startAtStr: string;
  enrolled: number;
  capacity: number;
  instructor: string;
  examCount: number;
  status: string;
}

export function TrainingSearch({ rows }: { rows: TrainingRow[] }) {
  const data: Row[] = rows.map((t) => ({
    name: t.name,
    category: t.category,
    city: t.city,
    startAtStr: t.startAtStr,
    kontenjan: `${t.enrolled}/${t.capacity}`,
    instructor: t.instructor,
    examCount: t.examCount,
    status: trainingStatusLabel[t.status] ?? { label: t.status, tone: "gray" },
  }));

  return (
    <DataTable
      columns={[
        { key: "name", label: "Eğitim" },
        { key: "category", label: "Kategori" },
        { key: "city", label: "İl" },
        { key: "startAtStr", label: "Başlangıç" },
        { key: "kontenjan", label: "Kontenjan" },
        { key: "instructor", label: "Eğitmen" },
        { key: "examCount", label: "Sınav" },
        { key: "status", label: "Durum", type: "badge" },
      ]}
      rows={data}
    />
  );
}
