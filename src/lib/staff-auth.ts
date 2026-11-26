import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "porcafe_staff";
const MAX_AGE = 60 * 60 * 24 * 30;

function password(): string {
  const p = process.env.STAFF_PASSWORD;
  if (!p) throw new Error("STAFF_PASSWORD is not set");
  return p;
}

// The cookie holds a signature derived from the password, so changing the
// password signs every staff device out.
function token(): string {
  return createHmac("sha256", password()).update("porcafe-staff-v1").digest("hex");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(attempt: string): boolean {
  return same(attempt, password());
}

export async function isStaff(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(value && same(value, token()));
}

export async function signIn(): Promise<void> {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    // Local previews run over plain http (also from a phone on the LAN), where secure cookies are dropped.
    secure: Boolean(process.env.VERCEL),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
