"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { SafeMember } from "@/lib/types";
import {
  IconArrowLeft,
  IconCheck,
  IconFingerprint,
  IconScan,
  IconX,
} from "@/components/Icons";

type Status = "idle" | "scanning" | "success" | "error";
type Result = { member: SafeMember; at: string; alreadyCheckedIn: boolean };

export default function KioskPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function scan() {
    if (status === "scanning") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("scanning");
    setMessage("");
    setResult(null);

    try {
      const optionsResponse = await fetch("/api/webauthn/auth/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const optionsData = await optionsResponse.json();
      if (!optionsResponse.ok) {
        throw new Error(optionsData.error ?? "تعذر بدء التحقق من البصمة");
      }

      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: optionsData.options });
      } catch {
        throw new Error(
          "لم يتم التعرف على البصمة. ضع إصبعك على المستشعر مرة أخرى، وتأكد من إعداد بصمة الإصبع أو Windows Hello على الجهاز.",
        );
      }

      const verifyResponse = await fetch("/api/webauthn/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: optionsData.requestId,
          response: assertion,
        }),
      });
      const data = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(data.error ?? "فشل التحقق من البصمة");
      }

      setResult(data);
      setStatus("success");
      resetTimer.current = setTimeout(() => {
        setStatus("idle");
        setResult(null);
      }, 9000);
    } catch (error) {
      setMessage((error as Error).message);
      setStatus("error");
      resetTimer.current = setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 9000);
    }
  }

  const time = now
    ? now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const date = now
    ? now.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-[420px] rounded-full bg-violet-500/10 blur-[120px]" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-12">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-gold/30 bg-black/40">
            <img src="/brand/logo.png" alt="الغريب" className="size-11 object-contain" />
          </span>
          <div>
            <p className="text-base font-extrabold leading-tight">بصمة الغريب</p>
            <p className="text-[10px] tracking-[0.25em] text-gold/70">GHAREEB BIOMETRIC</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-2xl font-extrabold tabular-nums">{time}</p>
            <p className="text-[11px] text-white/40">{date}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/55 transition hover:border-white/25 hover:text-white"
          >
            <IconArrowLeft className="size-4 rotate-180" />
            لوحة التحكم
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-4 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.06] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-lime">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
          </span>
          شاشة الحضور الذكية — جاهزة
        </div>
        <h1 className="mt-2 text-3xl font-extrabold md:text-[42px]">تحضير بلمسة إصبع</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/40">
          ضع إصبعك المسجّل على المستشعر ليتم التعرف عليك وتسجيل حضورك تلقائياً.
        </p>

        <div className="relative mt-9 mb-7 grid place-items-center">
          {status === "idle" || status === "scanning" ? (
            <>
              <span className="scan-ring" />
              <span className="scan-ring" />
              <span className="scan-ring" />
            </>
          ) : null}

          <button
            onClick={scan}
            disabled={status === "scanning"}
            className={`relative grid size-[236px] place-items-center rounded-full border transition-all duration-300 md:size-[268px] ${
              status === "success"
                ? "border-lime/60 bg-lime/10"
                : status === "error"
                  ? "border-rose-400/50 bg-rose-500/[0.07]"
                  : "border-lime/35 bg-lime/[0.05] hover:border-lime/60 hover:bg-lime/[0.09]"
            }`}
            aria-label="ابدأ التحقق بالبصمة"
          >
            <span
              className={`relative grid size-[176px] place-items-center overflow-hidden rounded-full border md:size-[204px] ${
                status === "success"
                  ? "border-lime/50 bg-lime/10 text-lime"
                  : status === "error"
                    ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
                    : "border-lime/30 bg-[#0a0c12] text-lime"
              }`}
            >
              {status === "success" ? (
                <span className="relative z-10 grid size-24 place-items-center rounded-full bg-lime text-ink md:size-28">
                  <IconCheck className="size-14 md:size-16" strokeWidth={2.4} />
                </span>
              ) : status === "error" ? (
                <IconX className="size-20 md:size-24" strokeWidth={1.6} />
              ) : (
                <>
                  <IconFingerprint
                    className={`size-24 md:size-32 ${status === "scanning" ? "animate-pulse" : "float-soft"}`}
                    strokeWidth={1.2}
                  />
                  {status === "scanning" ? (
                    <span className="scan-line absolute left-1/2 h-24 w-32 -translate-x-1/2 rounded-full bg-lime/20 blur-xl" />
                  ) : null}
                </>
              )}
            </span>
          </button>
        </div>

        <div className="min-h-[118px] w-full max-w-2xl">
          {status === "idle" ? (
            <div>
              <p className="text-xl font-bold text-white">ضع إصبعك للتحضير</p>
              <p className="mt-2 text-sm text-white/35">سيتم التعرف على هويتك تلقائياً — بدون كلمات مرور.</p>
            </div>
          ) : null}

          {status === "scanning" ? (
            <div>
              <p className="flex items-center justify-center gap-3 text-xl font-bold text-lime">
                <span className="inline-block size-5 animate-spin rounded-full border-2 border-lime/25 border-t-lime" />
                جارٍ التحقق من البصمة…
              </p>
              <p className="mt-2 text-sm text-white/35">أكمل تأكيد Windows Hello إذا ظهرت النافذة.</p>
            </div>
          ) : null}

          {status === "success" && result ? (
            <div className="rounded-3xl border border-lime/25 bg-lime/[0.06] px-6 py-5">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span
                  className="grid size-14 place-items-center rounded-2xl text-2xl font-extrabold"
                  style={{
                    background: `${result.member.color}22`,
                    color: result.member.color,
                  }}
                >
                  {result.member.name.slice(0, 1)}
                </span>
                <div className="text-right">
                  <p className="text-2xl font-extrabold">{result.member.name}</p>
                  <p className="text-xs text-white/45">
                    {result.member.role === "coach" ? "مدرب" : "لاعب"} — {result.member.sport}
                  </p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-lg font-extrabold tabular-nums text-lime">
                    {new Date(result.at).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[11px] text-lime/70">
                    {result.alreadyCheckedIn ? "حاضر بالفعل اليوم" : "تم تسجيل الحضور بنجاح"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-3xl border border-rose-400/25 bg-rose-500/[0.06] px-6 py-5">
              <p className="text-lg font-bold text-rose-200">تعذر التحقق</p>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-rose-100/60">
                {message}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] bg-black/20 px-6 py-4 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/scan"
            className="flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.07] px-4 py-2 text-[11px] font-semibold text-lime transition hover:border-lime/50 hover:bg-lime/[0.12]"
          >
            <IconScan className="size-4" />
            الحضور بباركود الكاميرا
          </Link>
          <p className="text-[11px] text-white/30">
            قائمة الأعضاء لا تُعرض على شاشة الحضور
          </p>
          <p className="text-[10px] text-white/25">
            أكاديمية الغريب — نظام الحضور
          </p>
        </div>
      </footer>
    </div>
  );
}
