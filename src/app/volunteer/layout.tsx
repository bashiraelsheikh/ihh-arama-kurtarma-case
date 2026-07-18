import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/shell";
import type { NavItem } from "@/components/dashboard/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/volunteer", label: "Ana Sayfa" },
  { href: "/volunteer/egitimlerim", label: "Eğitimlerim" },
  { href: "/volunteer/duyurular", label: "Duyurular" },
  { href: "/volunteer/operasyonlar", label: "Operasyonlarım" },
  { href: "/volunteer/profil", label: "Profil Bilgilerim" },
  { href: "/volunteer/iletisim", label: "İletişim Bilgilerim" },
  { href: "/volunteer/ayarlar", label: "Ayarlar" },
];

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("VOLUNTEER");
  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: session.profileId },
    include: { city: true },
  });

  return (
    <DashboardShell
      nav={NAV}
      subtitle="Gönüllü Paneli"
      user={{
        name: session.name,
        email: session.email,
        roleLabel: "Gönüllü",
        phone: profile?.phone,
        location: profile?.city.name,
      }}
    >
      {children}
    </DashboardShell>
  );
}
