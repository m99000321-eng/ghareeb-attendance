"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import type { SafeMember } from "@/lib/types";
import { IconCheck, IconClock, IconScan, IconX } from "./Icons";

type Result = { member: SafeMember; at: string; alreadyCheckedIn: boolean };

export default function BarcodeScanner() {
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [reading, setReading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setRunning(false);
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // already stopped
    }
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const scanner = scannerRef.current;
      if (scanner) void scanner.stop().catch(() => undefined);
    },
    [],
  );

  const submitCode = useCallback(async (code: string) => {
    const value = code.trim();
    if (!value || lockRef.current) return;
    lockRef.current = true;
    setError("");
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر تسجيل الحضور");
      setResult(data as Result);
      setManual("");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(data.alreadyCheckedIn ? 60 : [40, 60, 40]);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setResult(null), 9000);
    } catch (caught) {
      setError((caught as Error).message);
      setResult(null);
    } finally {
      setTimeout(() => {
        lockRef.current = false;
      }, 2500);
    }
  }, []);

  async function scanImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReading(true);
    setError("");
    const host = document.createElement("div");
    host.id = "barcode-file-reader";
    host.style.display = "none";
    document.body.appendChild(host);
    try {
      const { Html5Qrcode: Scanner } = await import("html5-qrcode");
      const scanner = new Scanner("barcode-file-reader", false);
      try {
        const decoded = await scanner.scanFile(file, false);
        await submitCode(decoded);
      } finally {
        try {
          scanner.clear();
        } catch {
          // already cleared
        }
      }
    } catch {
      setError(
        "مقدرتش أقرا الباركود من الصورة — جرّب تصوير أوضح وأقرب، أو امسح بالكاميرا مباشرة.",
      );
    } finally {
      host.remove();
      setReading(false);
    }
  }

  async function start() {
    if (starting || running) return;
    setStarting(true);
    setError("");    try {
      const { Html5Qrcode: Scanner, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      const scanner = new Scanner("barcode-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 300, height: 170 } },
        (decoded) => {
          void submitCode(decoded);
        },
        () => undefined,
      );
      setRunning(true);
    } catch {
      setError(
        "تعذر تشغيل الكاميرا. اسمح للموقع باستخدام الكاميرا، وتأكد أنك تفتح الرابط عبر HTTPS (أو أدخل الكود يدويًا بالأسفل).",
      );
      scannerRef.current = null;
    } finally {
      setStarting(false);
    }
  }

  const time = now
    ? now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const date = now
    ? now.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="rounded-3xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <div id="barcode-reader" className="min-h-[260px] w-full [&_video]:rounded-2xl" />
          {!running ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gradient-to-b from-black/70 via-black/40 to-black/80 text-center">
              <div className="px-6">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-lime/25 bg-lime/[0.07] text-lime">
                  <IconScan className="size-8" />
                </span>
                <p className="mt-4 text-lg font-extrabold">وجّه الكاميرا على باركود الطالب</p>
                <p className="mt-1 text-xs text-white/45">
                  الباركود على كارت العضو — المسح يسجل الحضور فورًا.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {running ? (
            <button
              onClick={stop}
              className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-rose-400/40 hover:text-rose-200"
            >
              إيقاف الكاميرا
            </button>
          ) : (
            <button
              onClick={start}
              disabled={starting}
              className="flex items-center justify-center gap-2 rounded-2xl bg-lime px-4 py-3 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
            >
              {starting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
              ) : (
                <IconScan className="size-5" />
              )}
              تشغيل الكاميرا
            </button>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitCode(manual);
            }}
            className="flex gap-2"
          >
            <input
              value={manual}
              onChange={(event) => setManual(event.target.value)}
              placeholder="أو اكتب كود العضو"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-lime/50"
            />
            <button
              type="submit"
              className="rounded-2xl border border-lime/30 px-4 text-sm font-bold text-lime transition hover:bg-lime/10"
            >
              تسجيل
            </button>
          </form>
        </div>

        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-lime/25 bg-lime/[0.05] px-4 py-3 text-sm font-bold text-lime transition hover:bg-lime/[0.1]">
          {reading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-lime/25 border-t-lime" />
          ) : (
            <IconScan className="size-5" />
          )}
          {reading ? "جاري قراءة الصورة…" : "صوّر الباركود بالكاميرا"}
          <input
            id="barcode-file"
            type="file"
            accept="image/*"
            onChange={scanImage}
            className="sr-only"
          />
        </label>
        <p className="mt-2 text-center text-[11px] text-white/30">
          لو المسح المباشر مش شغال، خد صورة للباركود والنظام هيقراها ويسجل الحضور.
        </p>

        {error ? (
          <p className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.07] px-4 py-3 text-xs leading-6 text-rose-200">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
          <div>
            <p className="text-2xl font-extrabold tabular-nums">{time}</p>
            <p className="text-[11px] text-white/40">{date}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.06] px-3 py-1.5 text-[11px] font-semibold text-lime">
            <span className="size-1.5 rounded-full bg-lime" />
            {running ? "الكاميرا تعمل" : "جاهز للمسح"}
          </span>
        </div>

        <div
          key={result ? `ok-${result.at}` : error ? "err" : "idle"}
          className="anim-pop min-h-[280px] rounded-3xl border border-white/10 bg-white/[0.02] p-6"
        >
          {result ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span
                className="grid size-20 place-items-center rounded-full text-3xl font-extrabold"
                style={{
                  background: `${result.member.color}22`,
                  color: result.member.color,
                }}
              >
                {result.member.name.slice(0, 1)}
              </span>
              <p className="mt-4 text-2xl font-extrabold">{result.member.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {result.member.role === "coach" ? "مدرب" : "لاعب"} — {result.member.sport}
                {result.member.group ? ` — ${result.member.group}` : ""}
              </p>
              <span
                className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                  result.alreadyCheckedIn
                    ? "border border-gold/30 bg-gold/10 text-gold"
                    : "border border-lime/30 bg-lime/10 text-lime"
                }`}
              >
                {result.alreadyCheckedIn ? <IconClock className="size-4" /> : <IconCheck className="size-4" />}
                {result.alreadyCheckedIn ? "حاضر بالفعل اليوم" : "تم تسجيل الحضور"}
              </span>
              <p className="mt-3 text-xs tabular-nums text-white/35">
                {new Date(result.at).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300">
                <IconX className="size-8" />
              </span>
              <p className="mt-4 text-lg font-bold text-rose-200">لم يتم التسجيل</p>
              <p className="mt-2 text-xs leading-6 text-white/40">{error}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/30">
                <IconScan className="size-8" />
              </span>
              <p className="mt-4 text-sm font-bold text-white/55">بانتظار مسح الباركود</p>
              <p className="mt-2 max-w-[240px] text-xs leading-6 text-white/30">
                بعد المسح تظهر بيانات الطالب وحالة الحضور هنا. لا تظهر قائمة الأعضاء على الشاشة.
              </p>
            </div>
          )}
        </div>

        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] leading-6 text-white/35">
          نصيحة: استخدم كاميرا خلفية وإضاءة جيدة. لو الباركود متضرر، اكتب كود العضو المطبوع
          تحت الباركود.
        </p>
      </div>
    </div>
  );
}
