import type { Metadata } from "next";
import Link from "next/link";
import BarcodeScanner from "@/components/BarcodeScanner";
import { IconArrowLeft, IconScan } from "@/components/Icons";

export const metadata: Metadata = {
  title: "الحضور بالباركود | أكاديمية الغريب",
};

export default function ScanPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-lime/[0.06] blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-gold/30 bg-black/40">
            <img src="/brand/logo.png" alt="الغريب" className="size-11 object-contain" />
          </span>
          <div>
            <p className="text-base font-extrabold leading-tight">أكاديمية الغريب</p>
            <p className="text-[10px] tracking-[0.25em] text-gold/70">GHAREEB ACADEMY</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
          >
            لوحة التحكم
            <IconArrowLeft className="size-4 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-12">
        <div className="anim-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.06] px-3 py-1.5 text-[11px] font-semibold text-lime">
              <IconScan className="size-4" />
              كاميرا الموبايل
            </div>
            <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">تسجيل الحضور بالباركود</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/45">
              امسح كارت الطالب بالكاميرا، والنظام يسجل الحضور تلقائيًا ويعرض اسمه وحالته — بدون
              عرض قائمة الأعضاء على الشاشة.
            </p>
          </div>
          <Link
            href="/members"
            className="hidden items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/55 transition hover:border-lime/40 hover:text-lime sm:flex"
          >
            طباعة كروت الباركود
          </Link>
        </div>

        <BarcodeScanner />
      </main>
    </div>
  );
}
