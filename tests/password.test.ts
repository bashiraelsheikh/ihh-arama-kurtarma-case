import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("parola hash", () => {
  it("hash düz metinden farklıdır (düz metin saklanmaz)", async () => {
    const plain = "GucluSifre123";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt formatı
  });
  it("doğru parola doğrulanır, yanlış parola reddedilir", async () => {
    const hash = await hashPassword("DogruSifre1");
    expect(await verifyPassword("DogruSifre1", hash)).toBe(true);
    expect(await verifyPassword("YanlisSifre1", hash)).toBe(false);
  });
});
