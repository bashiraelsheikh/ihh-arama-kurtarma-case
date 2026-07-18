import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/shell";
import type { NavItem } from "@/components/dashboard/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/instructor", label: "Ana Sayfa" },
  { href: "/instructor/egitimlerim", label: "Eğitimlerim" },
  { href: "/instructor/yoklamalar", label: "Eğitim Yoklamaları" },
  { href: "/instructor/sinav-sonuclari", label: "Sınav Sonuçları" },
  { href: "/instructor/profil", label: "Profil Bilgilerim" },
  { href: "/instructor/ayarlar", label: "Ayarlar" },
];

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("INSTRUCTOR");
  const profile = await prisma.instructorProfile.findUnique({
    where: { id: session.profileId },
    include: { city: true },
  });
  return (
    <DashboardShell
      nav={NAV}
      subtitle="Eğitmen Paneli"
      user={{ name: session.name, email: session.email, roleLabel: "Eğitmen", location: profile?.city.name }}
    >
      {children}
    </DashboardShell>
  );
}
