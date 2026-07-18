import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { dashboardPathForRole } from "@/lib/auth";
import { getCities } from "@/lib/reference";
import { RegisterForm } from "./register-form";
import { Logo } from "@/components/logo";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(dashboardPathForRole(session.role));
  const cities = await getCities();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-dark px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" variant="light" />
          <p className="mt-3 text-sm text-blue-100">Gönüllü Kaydı</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold text-slate-800">Gönüllü Olarak Kayıt Ol</h1>
          <p className="mb-6 text-sm text-slate-500">
            Kayıt işlemi yalnızca gönüllü hesabı oluşturur.
          </p>
          <RegisterForm cities={cities} />
          <div className="mt-6 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Giriş yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
