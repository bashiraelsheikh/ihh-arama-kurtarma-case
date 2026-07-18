import { prisma } from "./prisma";

export async function getCities() {
  return prisma.city.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, regionId: true, region: { select: { name: true } } },
  });
}

export async function getRegions() {
  return prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export async function getCategories() {
  return prisma.trainingCategory.findMany({
    where: { active: true },
    orderBy: [{ groupName: "asc" }, { level: "asc" }, { name: "asc" }],
    select: { id: true, name: true, groupName: true, level: true, areaCode: true, passingScore: true },
  });
}
