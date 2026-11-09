"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر تسجيل الدخول");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") ? next : "/";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[120px]" />

      <form onSubmit={submit} className="panel relative w-full max-w-sm p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-gold/30 bg-black/40">
            <img src="/brand/logo.png" alt="الغريب" className="size-11 object-contain" />
          </span>
          <div>
            <p className="text-lg font-extrabold leading-tight">بصمة الغريب</p>
            <p className="text-[10px] tracking-[0.22em] text-gold/80">GHAREEB BIOMETRIC</p>
          </div>
        </div>

        <h1 className="mt-7 text-xl font-extrabold">دخول الإدارة</h1>
        <p className="mt-1 text-xs text-white/40">
          لوحة الحضور والأعضاء محمية. أدخل كلمة مرور المدير للمتابعة.
        </p>

        <label className="mt-6 mb-1 block text-xs font-semibold text-white/55" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
          placeholder="••••••••"
          autoFocus
          required
        />

        {error ? <p className="mt-3 text-xs font-semibold text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-lime px-4 py-3 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>

        <a
          href="/kiosk"
          className="mt-4 block text-center text-[11px] text-white/35 transition hover:text-white/70"
        >
          شاشة البصمة العامة
        </a>
      </form>
    </div>
  );
}
