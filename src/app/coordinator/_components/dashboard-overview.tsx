"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiGet } from "@/lib/client-api";
import { FilterBar, buildFilterQuery, EMPTY_FILTERS, type FilterState, type Ref, type CityRef } from "./filter-bar";

interface Kpis {
  totalVolunteers: number;
  activeVolunteers: number;
  newVolunteers: number;
  totalInstructors: number;
  totalTrainings: number;
  completedTrainings: number;
  upcomingTrainings: number;
  totalExams: number;
  examAttendees: number;
  passRate: number;
}

export function DashboardOverview({
  regions,
  cities,
  categories,
}: {
  regions: Ref[];
  cities: CityRef[];
  categories: Ref[];
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const query = buildFilterQuery(filters, { scope: "overview" });

  const { data, isFetching } = useQuery({
    queryKey: ["overview", query],
    queryFn: async () => {
      const res = await apiGet<{ kpis: Kpis }>(`/api/coordinator/analytics?${query}`);
      if (!res.ok) throw new Error(res.error);
      return res.data!;
    },
  });
  const k = data?.kpis;

  return (
    <div className="space-y-6">
      <FilterBar
        regions={regions}
        cities={cities}
        categories={categories}
        state={filters}
        onChange={setFilters}
        fetching={isFetching}
      />
      {k && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Toplam Gönüllü" value={k.totalVolunteers} tone="blue" />
          <StatCard label="Aktif Gönüllü" value={k.activeVolunteers} tone="green" />
          <StatCard label="Toplam Eğitim" value={k.totalTrainings} />
          <StatCard label="Tamamlanan Eğitim" value={k.completedTrainings} tone="green" />
          <StatCard label="Yaklaşan Eğitim" value={k.upcomingTrainings} tone="yellow" />
          <StatCard label="Sınav Başarı" value={`%${k.passRate}`} tone="green" />
        </div>
      )}
    </div>
  );
}
