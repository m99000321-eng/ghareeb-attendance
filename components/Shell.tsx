import Link from "next/link";
import NavLinks from "./NavLinks";
import { IconFingerprint, IconScan } from "./Icons";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[286px] shrink-0 flex-col border-l border-white/[0.07] bg-[#07080d]/80 px-5 py-7 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-gold/30 bg-black/40">
            <img src="/brand/logo.png" alt="الغريب" className="size-11 object-contain" />
          </span>
          <span>
            <span className="block text-lg font-extrabold leading-tight">بصمة الغريب</span>
            <span className="block text-[10px] font-medium tracking-[0.22em] text-gold/80">
              GHAREEB BIOMETRIC
            </span>
          </span>
        </Link>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
          <p className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-white/30">
            القائمة الرئيسية
          </p>
          <NavLinks />
        </div>

        <div className="mt-4 space-y-3">
          <Link
            href="/kiosk"
            className="flex items-center gap-3 rounded-2xl border border-lime/25 bg-lime/[0.07] px-4 py-3.5 transition hover:border-lime/50 hover:bg-lime/[0.12]"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-lime text-ink">
              <IconFingerprint className="size-6" />
            </span>
            <span>
              <span className="block text-sm font-bold text-lime">شاشة البصمة</span>
              <span className="block text-[11px] text-white/40">وضع الكشك — تسجيل الحضور</span>
            </span>
          </Link>

          <Link
            href="/scan"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-lime/40 hover:bg-white/[0.06]"
          >
            <span className="grid size-10 place-items-center rounded-xl border border-lime/30 bg-lime/[0.08] text-lime">
              <IconScan className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-white/85">الحضور بالباركود</span>
              <span className="block text-[11px] text-white/40">كاميرا الموبايل — بدون قارئ</span>
            </span>
          </Link>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[11px] font-semibold text-white/45 transition hover:border-rose-400/30 hover:text-rose-200"
            >
              تسجيل الخروج
            </button>
          </form>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-white/35">
            أكاديمية الغريب للفنون القتالية
            <br />
            نظام البصمة الإصدار 1.0
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#05060a]/85 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/brand/logo.png" alt="الغريب" className="size-9 rounded-xl object-contain" />
              <span className="text-[15px] font-extrabold">بصمة الغريب</span>
            </Link>
            <Link
              href="/kiosk"
              className="rounded-full bg-lime px-4 py-2 text-xs font-bold text-ink"
            >
              شاشة البصمة
            </Link>
          </div>
          <div className="px-3 pb-3">
            <NavLinks mobile />
          </div>
        </header>

        <main className="anim-fade mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
