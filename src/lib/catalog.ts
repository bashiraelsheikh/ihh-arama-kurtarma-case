// Eğitim kataloğu - iş kurallarının ve seed verisinin ortak kaynağı

export interface CatalogEntry {
  name: string;
  groupName: string;
  level: number | null;
  area: string; // Alan (uzmanlık) kodu
  durationDays: number;
  passingScore: number;
}

// Temel (seviyesiz) eğitimler
export const BASIC_TRAININGS: CatalogEntry[] = [
  { name: "Afet Farkındalık Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Afet", durationDays: 2, passingScore: 60 },
  { name: "Depremde Arama ve Kurtarma Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Arama ve Kurtarma", durationDays: 3, passingScore: 60 },
  { name: "Enkazda Arama ve Kurtarma Temel Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Arama ve Kurtarma", durationDays: 3, passingScore: 60 },
  { name: "Navigasyon Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Navigasyon", durationDays: 2, passingScore: 60 },
  { name: "Kampçılık Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Doğa", durationDays: 2, passingScore: 60 },
  { name: "Haberleşme Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Haberleşme", durationDays: 1, passingScore: 60 },
  { name: "Yangın Farkındalık Eğitimi", groupName: "Temel Eğitimler", level: null, area: "Yangın", durationDays: 1, passingScore: 60 },
];

const LEVELED_GROUPS = [
  { group: "Kentsel Arama Kurtarma", area: "Kentsel Arama Kurtarma" },
  { group: "Su Arama Kurtarma", area: "Su Arama Kurtarma" },
  { group: "Doğada Arama Kurtarma", area: "Doğada Arama Kurtarma" },
];

const LEVEL_META: Record<number, { duration: number; passing: number }> = {
  1: { duration: 2, passing: 56 },
  2: { duration: 3, passing: 57 },
  3: { duration: 4, passing: 58 },
  4: { duration: 5, passing: 59 },
  5: { duration: 5, passing: 60 },
};

export const LEVELED_TRAININGS: CatalogEntry[] = LEVELED_GROUPS.flatMap((g) =>
  [1, 2, 3, 4, 5].map((lvl) => ({
    name: `${g.group} Seviye ${lvl} Eğitimi`,
    groupName: g.group,
    level: lvl,
    area: `${g.area} ${lvl}`,
    durationDays: LEVEL_META[lvl].duration,
    passingScore: LEVEL_META[lvl].passing,
  })),
);

export const FULL_CATALOG: CatalogEntry[] = [...BASIC_TRAININGS, ...LEVELED_TRAININGS];

export const CATALOG_GROUPS = [
  "Temel Eğitimler",
  "Kentsel Arama Kurtarma",
  "Su Arama Kurtarma",
  "Doğada Arama Kurtarma",
];

export function catalogByGroup(group: string): CatalogEntry[] {
  return FULL_CATALOG.filter((c) => c.groupName === group);
}
