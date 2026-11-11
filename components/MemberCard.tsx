"use client";

import { useEffect, useRef, useState } from "react";
import type { SafeMember } from "@/lib/types";
import { barcodeMessage, memberCardUrl, waLink } from "@/lib/format";
import {
  IconArrowLeft,
  IconCard,
  IconCheck,
  IconShield,
  IconUsers,
  IconWhatsApp,
} from "./Icons";

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("jsbarcode");
      const JsBarcode = mod.default;
      if (cancelled || !ref.current) return;
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 52,
        width: 1.8,
        background: "#ffffff",
        lineColor: "#000000",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return <svg ref={ref} className="h-[52px] w-full" role="img" aria-label={`باركود ${value}`} />;
}

export default function MemberCard({
  member,
  publicView = false,
}: {
  member: SafeMember;
  publicView?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const token = member.barcodeToken ?? "";
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const cardUrl = token ? memberCardUrl(origin, token) : "";
  const message = barcodeMessage(member, cardUrl);

  function sendWhatsApp(phone: string) {
    if (!phone) return;
    window.open(waLink(phone, message), "_blank", "noopener");
  }

  async function copyLink() {
    if (!cardUrl) return;
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("انسخ رابط الباركود:", cardUrl);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {!publicView ? (
        <>
          <div className="no-print flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink transition hover:brightness-105"
            >
              <IconCard className="size-4" />
              طباعة الكارت
            </button>
            <button
              onClick={() => sendWhatsApp(member.phone)}
              disabled={!member.phone}
              title={member.phone ? "إرسال الباركود على واتساب الطالب" : "أضف رقم هاتف الطالب أولاً"}
              className="flex items-center gap-2 rounded-xl border border-[#25d366]/35 bg-[#25d366]/[0.08] px-5 py-3 text-sm font-bold text-[#6ef0a2] transition hover:bg-[#25d366]/[0.16] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconWhatsApp className="size-4" />
              واتساب الطالب
            </button>
            <button
              onClick={() => sendWhatsApp(member.parentPhone ?? "")}
              disabled={!member.parentPhone}
              title={member.parentPhone ? "إرسال الباركود على واتساب ولي الأمر" : "أضف رقم ولي الأمر أولاً"}
              className="flex items-center gap-2 rounded-xl border border-[#25d366]/25 bg-white/[0.03] px-5 py-3 text-sm font-bold text-[#6ef0a2]/80 transition hover:bg-[#25d366]/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconWhatsApp className="size-4" />
              واتساب ولي الأمر
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              {copied ? <IconCheck className="size-4 text-lime" /> : null}
              {copied ? "تم نسخ الرابط" : "نسخ رابط الباركود"}
            </button>
          </div>

          <p className="no-print max-w-lg text-center text-xs leading-relaxed text-white/35">
            رابط الباركود يفتح كارت الطالب على أي موبايل بدون تسجيل دخول — الطالب يعرضه للكاميرا عند
            الحضور. اطبع الكارت كنسخة احتياطية، وقصّه على المقاس المحدد.
          </p>
        </>
      ) : (
        <p className="no-print max-w-sm text-center text-sm leading-relaxed text-white/55">
          اعرض الباركود ده قدام كاميرا الحضور في الأكاديمية.
        </p>
      )}

      <div className="card-sheet">
        <article className="member-card">
          <div className="member-card__glow" />
          <header className="member-card__header">
            <img src="/brand/logo.png" alt="الغريب" className="member-card__logo" />
            <div className="member-card__brand">
              <p className="member-card__brand-ar">أكاديمية الغريب</p>
              <p className="member-card__brand-en">GHAREEB ACADEMY</p>
            </div>
            <span className="member-card__role">
              {member.role === "coach" ? (
                <IconShield className="size-3" />
              ) : (
                <IconUsers className="size-3" />
              )}
              {member.role === "coach" ? "مدرب" : "لاعب"}
            </span>
          </header>

          <div className="member-card__body">
            <div className="min-w-0">
              <p className="member-card__name">{member.name}</p>
              <p className="member-card__meta">
                {member.sport}
                {member.group ? ` — ${member.group}` : ""}
              </p>
            </div>
            <span
              className="member-card__avatar"
              style={{ background: `${member.color}26`, color: member.color }}
            >
              {member.name.slice(0, 1)}
            </span>
          </div>

          <div className="member-card__barcode">
            <Barcode value={member.id} />
            <p className="member-card__code" dir="ltr">
              {member.id}
            </p>
          </div>
        </article>
      </div>

      {!publicView ? (
        <button
          onClick={() => window.history.back()}
          className="no-print flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
        >
          <IconArrowLeft className="size-4 rotate-180" />
          رجوع
        </button>
      ) : null}
    </div>
  );
}
