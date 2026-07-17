import Link from "next/link";
import { Logo } from "@/components/logo";
import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-dark px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" variant="light" />
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold text-slate-800">Şifremi Unuttum</h1>
          <p className="mb-6 text-sm text-slate-500">
            Kayıtlı e-posta adresinizi girin. Hesabınız bulunursa sıfırlama talimatları gönderilir.
          </p>
          <ForgotPasswordForm />
          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
