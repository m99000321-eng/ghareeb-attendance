import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ATTENDANCE_PASSWORD;
  const key = clientKey(request);
  const now = Date.now();

  const record = attempts.get(key);
  if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
    const wait = Math.ceil((record.resetAt - now) / 60000);
    return NextResponse.json(
      { error: `محاولات كثيرة. حاول تاني بعد ${wait} دقيقة.` },
      { status: 429, headers: { "Retry-After": String(wait * 60) } },
    );
  }
  if (record && record.resetAt <= now) attempts.delete(key);

  if (!expected) {
    return NextResponse.json(
      { error: "كلمة مرور النظام غير مضبوطة على السيرفر" },
      { status: 500 },
    );
  }

  if (body.password !== expected) {
    const current = attempts.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };
    current.count += 1;
    if (current.resetAt <= now) current.resetAt = now + WINDOW_MS;
    attempts.set(key, current);
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  attempts.delete(key);

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
