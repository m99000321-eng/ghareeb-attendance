"use client";

import { useEffect, useRef } from "react";
import type { SafeMember } from "@/lib/types";
import { IconArrowLeft, IconCard, IconShield, IconUsers } from "./Icons";

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

export default function MemberCard({ member }: { member: SafeMember }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="no-print flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink transition hover:brightness-105"
        >
          <IconCard className="size-4" />
          طباعة الكارت
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
        >
          <IconArrowLeft className="size-4 rotate-180" />
          رجوع
        </button>
      </div>

      <p className="no-print max-w-md text-center text-xs leading-relaxed text-white/35">
        اطبع الكارت وقصّه على المقاس المحدد وسلّمه للطالب. يُستخدم الباركود في تسجيل الحضور من صفحة
        «الحضور بالباركود» بكاميرا الموبايل.
      </p>

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
    </div>
  );
}
