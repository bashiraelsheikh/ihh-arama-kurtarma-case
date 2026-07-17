import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { dashboardPathForRole } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(dashboardPathForRole(session.role));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-dark px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" variant="light" />
          <p className="mt-3 text-sm text-orange-100">İHH Merkezi Eğitim Sistemi</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold text-slate-800">Giriş Yap</h1>
          <p className="mb-6 text-sm text-slate-500">Hesabınıza erişmek için giriş yapın.</p>
          <LoginForm />
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-accent hover:underline">
              Şifremi unuttum
            </Link>
            <Link href="/register" className="font-medium text-accent hover:underline">
              Gönüllü olarak kayıt ol
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-blue-100">
          Demo hesaplar için README dosyasına bakınız.
        </p>
      </div>
    </div>
  );
}
