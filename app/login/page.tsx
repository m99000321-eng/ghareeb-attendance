"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconChart,
  IconCheck,
  IconScan,
  IconShield,
} from "@/components/Icons";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="orb-drift pointer-events-none absolute -top-40 right-1/4 size-[520px] rounded-full bg-lime/[0.07] blur-[120px]" />
      <div
        className="orb-drift pointer-events-none absolute -bottom-48 left-1/4 size-[460px] rounded-full bg-violet-500/10 blur-[120px]"
        style={{ animationDelay: "-6s" }}
      />

      <div className="anim-pop relative w-full max-w-4xl">
        <div className="panel overflow-hidden">
          <div className="lg:grid lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative overflow-hidden border-b border-white/[0.06] p-7 sm:p-9 lg:border-b-0 lg:border-l">
              <div className="pointer-events-none absolute -top-16 left-0 size-56 rounded-full bg-gold/[0.07] blur-3xl" />

              <div className="relative flex items-center gap-3">
                <span className="grid size-14 place-items-center overflow-hidden rounded-2xl border border-gold/35 bg-black/50 shadow-[0_0_40px_-12px_rgba(217,180,91,0.55)]">
                  <img src="/brand/logo.png" alt="الغريب" className="size-12 object-contain" />
                </span>
                <div>
                  <p className="text-xl font-extrabold leading-tight">أكاديمية الغريب</p>
                  <p className="text-[10px] tracking-[0.24em] text-gold/80">GHAREEB ACADEMY</p>
                </div>
              </div>

              <h1 className="anim-fade-up delay-1 relative mt-8 text-[26px] font-extrabold leading-snug sm:text-[30px]">
                نظام حضور الأكاديمية
                <span className="mt-1 block bg-gradient-to-l from-lime via-lime/80 to-gold bg-clip-text text-transparent">
                  بالباركود وكاميرا الموبايل
                </span>
              </h1>
              <p className="anim-fade-up delay-2 mt-3 max-w-sm text-sm leading-7 text-white/45">
                لوحة واحدة لإدارة اللاعبين والمدربين، تسجيل الحضور، الاشتراكات والتقارير —
                بدون أوراق.
              </p>

              <ul className="anim-fade-up delay-3 mt-7 space-y-3">
                {[
                  {
                    icon: <IconScan className="size-4" />,
                    title: "باركود بكاميرا الموبايل",
                    hint: "امسح كارت الطالب وسجّل الحضور فورًا.",
                  },
                  {
                    icon: <IconChart className="size-4" />,
                    title: "تقارير وExcel",
                    hint: "حضور، غياب، اشتراكات ومصروفات.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-[13px] font-bold text-white/85">
                        {item.title}
                      </span>
                      <span className="block text-[11px] text-white/35">{item.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.05] px-3 py-1.5 text-[10px] font-semibold text-lime">
                <IconShield className="size-3.5" />
                محمي بكلمة مرور المدير — جلسة ١٢ ساعة
              </div>
            </div>

            <div className="relative p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">دخول الإدارة</h2>
                  <p className="mt-1 text-[11px] text-white/40">
                    أدخل كلمة مرور المدير للمتابعة.
                  </p>
                </div>
                <span className="soft-pulse flex size-2.5 rounded-full bg-lime shadow-[0_0_14px_rgba(200,255,46,0.8)]" />
              </div>

              <form onSubmit={submit} className="mt-7">
                <label className="mb-1.5 block text-xs font-semibold text-white/55" htmlFor="password">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pr-4 pl-16 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50 focus:ring-2 focus:ring-lime/10"
                    placeholder="••••••••"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white/40 transition hover:bg-white/[0.06] hover:text-white/75"
                  >
                    {show ? "إخفاء" : "إظهار"}
                  </button>
                </div>

                {error ? (
                  <p className="anim-pop mt-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-3.5 py-2.5 text-[11px] font-semibold text-rose-200">
                    {error}
                  </p>
                ) : (
                  <p className="mt-3 flex items-center gap-1.5 text-[10px] text-white/25">
                    <IconCheck className="size-3 text-lime/50" />
                    دخول آمن — لا يتم تخزين كلمة المرور في المتصفح.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-extrabold text-ink lime-glow transition hover:brightness-105 disabled:opacity-60"
                >
                  {busy ? (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
                  ) : null}
                  {busy ? "جارٍ الدخول…" : "دخول لوحة التحكم"}
                </button>
              </form>

              <div className="mt-6">
                <Link
                  href="/scan"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] font-semibold text-white/50 transition hover:border-lime/35 hover:text-lime"
                >
                  <IconScan className="size-3.5" />
                  مسح الباركود
                </Link>
              </div>

              <p className="mt-5 text-center text-[10px] text-white/20">
                أكاديمية الغريب — نظام الحضور الإصدار 1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
