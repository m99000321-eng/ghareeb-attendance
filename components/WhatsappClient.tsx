"use client";

import { useCallback, useEffect, useState } from "react";
import type { WhatsappStatus } from "@/lib/types";
import { IconCheck, IconShield, IconWhatsApp, IconX } from "./Icons";

const STATE_LABEL: Record<string, string> = {
  authorized: "متصل ويعمل",
  notAuthorized: "غير مرتبط — امسح الـ QR",
  starting: "جاري تشغيل الجلسة…",
  sleepMode: "الجلسة نائمة",
  blocked: "الرقم محظور من واتساب",
  yellowCard: "تحذير من واتساب",
  unauthorized: "المفاتيح مرفوضة",
  unreachable: "تعذر الوصول لـ Green API",
  error: "خطأ في الاتصال",
  unconfigured: "الإرسال غير مفعّل",
};

const STATE_TONE: Record<string, string> = {
  authorized: "border-lime/35 bg-lime/10 text-lime",
  unconfigured: "border-white/10 bg-white/[0.04] text-white/40",
};

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`inline-block size-4 animate-spin rounded-full border-2 ${
        light ? "border-ink/25 border-t-ink" : "border-white/20 border-t-white/70"
      }`}
    />
  );
}

export default function WhatsappClient({ initial }: { initial: WhatsappStatus }) {
  const [status, setStatus] = useState(initial);
  const [editing, setEditing] = useState(!initial.configured);
  const [instanceId, setInstanceId] = useState(initial.provider === "green" ? initial.instanceId : "");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState<{ type: string; image?: string; message?: string } | null>(null);
  const [testPhone, setTestPhone] = useState("01114845463");
  const [testing, setTesting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/whatsapp/config", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as WhatsappStatus;
    setStatus(data);
    return data;
  }, []);

  useEffect(() => {
    let alive = true;

    async function tick() {
      const data = await refresh().catch(() => null);
      if (!alive || !data) return;
      if (data.provider === "green" && data.state !== "authorized") {
        const next = await fetch("/api/whatsapp/qr", { cache: "no-store" })
          .then((response) => response.json())
          .catch(() => null);
        if (alive && next) setQr(next);
      } else {
        setQr(null);
      }
    }

    tick();
    const timer = window.setInterval(tick, 6000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function saveCredentials(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId, token }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ المفاتيح");
      setToken("");
      setEditing(false);
      setNotice({ kind: "ok", text: "تم حفظ المفاتيح — امسح الـ QR من موبايل الأكاديمية" });
      await refresh();
    } catch (error) {
      setNotice({ kind: "err", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function removeCredentials() {
    if (!window.confirm("فصل واتساب عن النظام؟ لازم تمسح QR من جديد.")) return;
    setNotice(null);
    try {
      const response = await fetch("/api/whatsapp/config", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر الحذف");
      setStatus({
        configured: false,
        provider: null,
        source: null,
        state: "unconfigured",
        instanceId: "",
        phone: "",
        tokenTail: "",
      });
      setEditing(true);
      setNotice({ kind: "ok", text: "تم فصل الحساب" });
      await refresh();
    } catch (error) {
      setNotice({ kind: "err", text: (error as Error).message });
    }
  }

  async function sendTest() {
    if (!testPhone.trim()) {
      setNotice({ kind: "err", text: "اكتب رقم للاختبار" });
      return;
    }
    setTesting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        configured?: boolean;
      };
      if (!response.ok) throw new Error(data.error ?? "تعذر إرسال رسالة الاختبار");
      setNotice({ kind: "ok", text: `وصلت رسالة الاختبار على ${testPhone.trim()} ✅` });
    } catch (error) {
      setNotice({ kind: "err", text: (error as Error).message });
    } finally {
      setTesting(false);
    }
  }

  async function unlinkPhone() {
    if (
      !window.confirm(
        "هيتم فصل واتساب عن الرقم الحالي، والإرسال هيقف لحد ما تمسح QR من رقم الأكاديمية. نكمل؟",
      )
    )
      return;
    setUnlinking(true);
    setNotice(null);
    try {
      const response = await fetch("/api/whatsapp/logout", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر فصل الربط");
      setNotice({ kind: "ok", text: "تم فصل الرقم — امسح الـQR اللي هيظهر من موبايل الأكاديمية" });
      await refresh();
    } catch (error) {
      setNotice({ kind: "err", text: (error as Error).message });
    } finally {
      setUnlinking(false);
    }
  }

  const connected = status.state === "authorized";
  const stateLabel = STATE_LABEL[status.state] ?? status.state;
  const stateTone = STATE_TONE[status.state] ?? "border-gold/35 bg-gold/10 text-gold";

  return (
    <div className="flex flex-col gap-6">
      <div className="anim-fade-up flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">
            WHATSAPP CONNECTION
          </p>
          <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
            واتساب الأكاديمية
          </h1>
          <p className="mt-2 text-sm text-white/45">
            اربط رقم الأكاديمية وابعت الباركود للاعبين وأولياء الأمور من غير أي موقع تاني.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-xs font-bold md:self-auto ${stateTone}`}
        >
          <span className="relative flex size-2">
            <span
              className={`absolute inline-flex size-2 animate-ping rounded-full ${
                connected ? "bg-lime" : "bg-gold"
              } opacity-60`}
            />
            <span
              className={`relative inline-flex size-2 rounded-full ${connected ? "bg-lime" : "bg-gold"}`}
            />
          </span>
          {stateLabel}
        </span>
      </div>

      {notice ? (
        <div
          className={`anim-pop flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.kind === "ok"
              ? "border-lime/35 bg-lime/10 text-lime"
              : "border-rose-400/35 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.kind === "ok" ? <IconCheck className="mt-0.5 size-4" /> : <IconX className="mt-0.5 size-4" />}
          <span className="leading-relaxed">{notice.text}</span>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="anim-fade-up delay-1 panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">بيانات Green API</h2>
              <p className="mt-1 text-xs text-white/40">
                {status.source === "env"
                  ? "المفاتيح جاية من إعدادات السيرفر (Vercel)."
                  : "محفوظة داخل النظام ومشفّرة على السيرفر — التوكن مش بيظهر في المتصفح."}
              </p>
            </div>
            {status.configured && status.source === "db" ? (
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
              >
                {editing ? "إلغاء" : "تغيير المفاتيح"}
              </button>
            ) : null}
          </div>

          {status.configured && !editing ? (
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/25 px-3.5 py-2.5">
                <dt className="text-white/45">المزوّد</dt>
                <dd className="font-bold">
                  {status.provider === "green" ? "Green API" : "WhatsApp Cloud API"}
                </dd>
              </div>
              {status.provider === "green" ? (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/25 px-3.5 py-2.5">
                    <dt className="text-white/45">idInstance</dt>
                    <dd dir="ltr" className="font-mono text-xs tabular-nums">
                      {status.instanceId}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/25 px-3.5 py-2.5">
                    <dt className="text-white/45">apiTokenInstance</dt>
                    <dd dir="ltr" className="font-mono text-xs">••••••••{status.tokenTail}</dd>
                  </div>
                </>
              ) : null}
              {status.phone ? (
                <div className="flex items-center justify-between rounded-xl border border-lime/20 bg-lime/[0.06] px-3.5 py-2.5">
                  <dt className="text-lime/70">الرقم المرتبط</dt>
                  <dd dir="ltr" className="font-bold tabular-nums text-lime">
                    {status.phone}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <form onSubmit={saveCredentials} className="grid gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/55">
                  idInstance
                </label>
                <input
                  value={instanceId}
                  onChange={(event) => setInstanceId(event.target.value)}
                  placeholder="1101xxxxxxxx"
                  dir="ltr"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/55">
                  apiTokenInstance
                </label>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="انسخ التوكن كامل من صفحة الـInstance"
                  dir="ltr"
                  type="password"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {saving ? <Spinner light /> : <IconShield className="size-4" />}
                حفظ وربط الرقم
              </button>
              <p className="text-[11px] leading-relaxed text-white/30">
                المفاتيح بتظهر مرة واحدة في لوحة Green API. النظام بيستخدمها بس للسيرفر، ومش بيرجعها
                للمتصفح.
              </p>
            </form>
          )}

          {status.configured && status.source === "db" && !editing ? (
            <button
              type="button"
              onClick={removeCredentials}
              className="mt-4 w-full rounded-xl border border-rose-400/20 px-4 py-2.5 text-[11px] font-semibold text-rose-300/80 transition hover:border-rose-400/45 hover:bg-rose-500/10"
            >
              فصل الحساب وحذف المفاتيح
            </button>
          ) : null}
        </section>

        <div className="flex flex-col gap-6">
          {status.provider === "green" && !connected ? (
            <section className="anim-fade-up delay-2 panel p-5 text-center sm:p-6">
              <h2 className="text-base font-bold">امسح الكود من موبايل الأكاديمية</h2>
              <ol className="mt-2 space-y-1 text-[11px] leading-relaxed text-white/40">
                <li>1. افتح واتساب على الموبايل.</li>
                <li>2. الإعدادات ← الأجهزة المرتبطة ← ربط جهاز.</li>
                <li>3. صوّر الكود اللي تحت — بيتجدد تلقائي كل شوية.</li>
              </ol>
              <div className="mt-4 grid place-items-center">
                {qr?.image ? (
                  <div className="rounded-2xl bg-white p-3 shadow-[0_18px_60px_-24px_rgba(200,255,46,0.45)]">
                    <img src={qr.image} alt="QR ربط واتساب" className="size-[220px] object-contain" />
                  </div>
                ) : (
                  <div className="grid size-[220px] place-items-center rounded-2xl border border-dashed border-white/15 bg-black/30 text-xs text-white/35">
                    {qr?.type === "loading" ? "جاري تجهيز الكود…" : "استنى ثواني…"}
                  </div>
                )}
              </div>
              <p className="mt-3 text-[11px] text-white/30">
                لو الكود مش بيتقرأ، استنى 6 ثواني وهيتحدث لوحده.
              </p>
            </section>
          ) : null}

          {connected ? (
            <section className="anim-fade-up delay-2 panel p-5 sm:p-6">
              <div className="flex items-center gap-2 text-lime">
                <IconCheck className="size-5" />
                <h2 className="text-base font-bold">واتساب متصل وجاهز للإرسال</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                أي عضو عليه رقم هاتف هيتابعله الباركود مباشرة من زر واتساب في قائمة الأعضاء أو من
                كارت العضو.
              </p>
              <div className="mt-4 grid gap-2">
                <label className="text-xs font-semibold text-white/55">جرّب الإرسال على رقم</label>
                <div className="flex gap-2">
                  <input
                    value={testPhone}
                    onChange={(event) => setTestPhone(event.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    inputMode="tel"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
                  />
                  <button
                    type="button"
                    onClick={sendTest}
                    disabled={testing}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-xs font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
                  >
                    {testing ? <Spinner light /> : <IconWhatsApp className="size-4" />}
                    إرسال تجربة
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[11px] font-semibold text-white/55">
                  الرقم الحالي مرتبط على واتساب الشخصي؟
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                  افصله واربط رقم الأكاديمية بدله — الرسائل هتتبعت من رقم الأكاديمية، وكل محادثاتك
                  الشخصية تفضل بره النظام.
                </p>
                <button
                  type="button"
                  onClick={unlinkPhone}
                  disabled={unlinking}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.07] px-4 py-2.5 text-[11px] font-bold text-gold transition hover:bg-gold/[0.14] disabled:opacity-60"
                >
                  {unlinking ? <Spinner /> : null}
                  فصل الربط عن الرقم الحالي
                </button>
              </div>
            </section>
          ) : null}

          {status.provider === "meta" ? (
            <section className="anim-fade-up delay-2 panel p-5 sm:p-6">
              <h2 className="text-base font-bold">WhatsApp Cloud API</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                الإرسال شغال بمفاتيح Meta المحفوظة على السيرفر. لإرسال أول رسالة للاعبين لازم يكون
                الرقم مسجّل في الـ Sandbox أو عنده Template معتمد.
              </p>
            </section>
          ) : null}

          {!status.configured ? (
            <section className="anim-fade-up delay-2 panel p-5 sm:p-6">
              <h2 className="text-base font-bold">هات المفاتيح منين؟</h2>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-white/45">
                <li>
                  <span className="font-bold text-white/70">1.</span> سجّل مرة واحدة على{" "}
                  <a
                    href="https://console.green-api.com/auth/register"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-lime underline decoration-lime/30 underline-offset-4 hover:decoration-lime"
                  >
                    console.green-api.com
                  </a>
                  .
                </li>
                <li>
                  <span className="font-bold text-white/70">2.</span> Create Instance ← WhatsApp.
                </li>
                <li>
                  <span className="font-bold text-white/70">3.</span> انسخ idInstance والتوكن
                  وحطهم هنا — وبعدها الربط والـQR كله جوه النظام.
                </li>
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
