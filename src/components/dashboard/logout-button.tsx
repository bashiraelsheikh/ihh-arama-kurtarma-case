"use client";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/15">
        Çıkış Yap
      </Button>
    </form>
  );
}
