import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/shell";
import type { NavItem } from "@/components/dashboard/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/coordinator", label: "Dashboard" },
  { href: "/coordinator/egitimler", label: "Eğitim Yönetimi" },
  { href: "/coordinator/sinav-olustur", label: "Sınav Oluştur" },
  { href: "/coordinator/sinavlarim", label: "Sınavlarım" },
  { href: "/coordinator/gonulluler", label: "Gönüllüler" },
  { href: "/coordinator/egitmenler", label: "Eğitmenler" },
  { href: "/coordinator/analiz", label: "Analiz ve Raporlar" },
  { href: "/coordinator/harita", label: "Harita ve Dağılım" },
  { href: "/coordinator/ayarlar", label: "Ayarlar" },
];

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("COORDINATOR");
  const profile = await prisma.coordinatorProfile.findUnique({
    where: { id: session.profileId },
    include: { responsibleRegion: true, city: true },
  });
  return (
    <DashboardShell
      nav={NAV}
      subtitle="Eğitim Yönetimi"
      user={{
        name: session.name,
        email: session.email,
        roleLabel: `Merkez Eğitim Sorumlusu · ${profile?.responsibleRegion.name ?? ""}`,
        location: profile?.city.name,
      }}
    >
      {children}
    </DashboardShell>
  );
}
