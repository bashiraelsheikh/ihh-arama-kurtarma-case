"use client";

import { Card, CardHeader, CardTitle, CardBody, Select, Label, Input, Spinner } from "@/components/ui";

export interface Ref {
  id: string;
  name: string;
}
export interface CityRef extends Ref {
  regionId: string;
}

export interface FilterState {
  regionId: string;
  cityId: string;
  categoryId: string;
  startDate: string;
  endDate: string;
}

export const EMPTY_FILTERS: FilterState = {
  regionId: "",
  cityId: "",
  categoryId: "",
  startDate: "",
  endDate: "",
};

export function buildFilterQuery(state: FilterState, extra?: Record<string, string>): string {
  const p = new URLSearchParams();
  if (state.regionId) p.set("regionId", state.regionId);
  if (state.cityId) p.set("cityId", state.cityId);
  if (state.categoryId) p.set("categoryId", state.categoryId);
  if (state.startDate) p.set("startDate", state.startDate);
  if (state.endDate) p.set("endDate", state.endDate);
  if (extra) for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p.toString();
}

export function FilterBar({
  regions,
  cities,
  categories,
  state,
  onChange,
  fetching,
}: {
  regions: Ref[];
  cities: CityRef[];
  categories: Ref[];
  state: FilterState;
  onChange: (next: FilterState) => void;
  fetching?: boolean;
}) {
  const filteredCities = state.regionId ? cities.filter((c) => c.regionId === state.regionId) : cities;
  function set<K extends keyof FilterState>(key: K, value: string) {
    const next = { ...state, [key]: value };
    if (key === "regionId") next.cityId = ""; // bölge değişince il sıfırla
    onChange(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Rapor ve Analiz Filtresi
          {fetching && <Spinner className="ml-2 inline h-3 w-3 text-slate-400" />}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>Bölge</Label>
            <Select value={state.regionId} onChange={(e) => set("regionId", e.target.value)}>
              <option value="">Tümü</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>İl</Label>
            <Select value={state.cityId} onChange={(e) => set("cityId", e.target.value)}>
              <option value="">Tümü</option>
              {filteredCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Eğitim Alanı</Label>
            <Select value={state.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Tümü</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Başlangıç Tarihi</Label>
            <Input type="date" value={state.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div>
            <Label>Bitiş Tarihi</Label>
            <Input type="date" value={state.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
