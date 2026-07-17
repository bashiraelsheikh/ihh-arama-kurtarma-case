import Link from "next/link";
import { Logo } from "@/components/logo";
import { LogoutButton } from "./logout-button";
import { SidebarNav, type NavItem } from "./sidebar-nav";

export interface ShellUser {
  name: string;
  email: string;
  roleLabel: string;
  phone?: string;
  location?: string;
}

export function DashboardShell({
  nav,
  user,
  subtitle,
  children,
}: {
  nav: NavItem[];
  user: ShellUser;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Logo variant="light" subtitle={subtitle} />
        </div>
        <SidebarNav items={nav} />
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-blue-200">{user.roleLabel}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">Hoş geldiniz,</p>
              <p className="text-base font-semibold text-slate-800">{user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">{user.email}</p>
                {user.location && <p className="text-xs text-slate-400">{user.location}</p>}
              </div>
            </div>
          </div>
        </header>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
