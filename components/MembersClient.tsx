"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Role, SafeMember, Sport } from "@/lib/types";
import {
  IconArrowLeft,
  IconCard,
  IconCheck,
  IconFingerprint,
  IconPlus,
  IconSearch,
  IconShield,
  IconTrash,
  IconUsers,
  IconWhatsApp,
  IconX,
} from "./Icons";

const SPORTS: Sport[] = ["ملاكمة", "كيك بوكس", "كونغ فو", "MMA"];
const ROLE_LABEL: Record<Role, string> = { player: "لاعب", coach: "مدرب" };

function Spinner() {
  return (
    <span className="inline-block size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
  );
}

export default function MembersClient({ initial }: { initial: SafeMember[] }) {
  const [members, setMembers] = useState(initial);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    role: "player" as Role,
    sport: "MMA" as Sport,
    phone: "",
    parentPhone: "",
    group: "",
  });

  const filtered = useMemo(() => {
    const term = query.trim();
    return members.filter((member) => {
      const matchRole = role === "all" || member.role === role;
      const matchTerm =
        !term ||
        member.name.includes(term) ||
        member.phone.includes(term) ||
        member.sport.includes(term) ||
        (member.group ?? "").includes(term);
      return matchRole && matchTerm;
    });
  }, [members, query, role]);

  function notify(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4200);
  }

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    setBusy("add");
    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر إضافة العضو");
      setMembers((current) => [data.member as SafeMember, ...current]);
      setOpen(false);
      setForm({ name: "", role: "player", sport: "MMA", phone: "", parentPhone: "", group: "" });
      notify("ok", "تمت الإضافة — اطبع الكارت أو ابعت الباركود على واتساب.");
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(member: SafeMember) {
    if (!window.confirm(`حذف ${member.name} وكل سجلات حضوره؟`)) return;
    setBusy(`delete:${member.id}`);
    try {
      const response = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("تعذر حذف العضو");
      setMembers((current) => current.filter((item) => item.id !== member.id));
      notify("ok", "تم حذف العضو");
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function checkIn(member: SafeMember) {
    setBusy(`checkin:${member.id}`);
    try {
      const response = await fetch(`/api/members/${member.id}/checkin`, { method: "POST" });
      if (!response.ok) throw new Error("تعذر تسجيل الحضور");
      notify("ok", `تم تسجيل حضور ${member.name}`);
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendBarcode(member: SafeMember) {
    const phone = member.phone || member.parentPhone || "";
    if (!phone) {
      notify("err", "أضف رقم الهاتف أو رقم ولي الأمر أولاً");
      return;
    }
    if (!member.barcodeToken) {
      notify("err", "رابط الباركود غير جاهز — افتح كارت العضو ثم حاول مرة أخرى");
      return;
    }

    setBusy(`wa:${member.id}`);
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, phone }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        configured?: boolean;
        kind?: "image" | "text";
      };
      if (!response.ok) {
        throw new Error(
          data.configured === false
            ? "الإرسال التلقائي غير مفعّل — أضف مفاتيح واتساب على السيرفر"
            : data.error ?? "تعذر إرسال الباركود",
        );
      }
      notify(
        "ok",
        `${data.kind === "image" ? "تم إرسال صورة الباركود" : "تم إرسال الباركود"} على واتساب ${phone}`,
      );
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="anim-fade-up flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">
            MEMBERS & COACHES
          </p>
          <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
            اللاعبون والمدربون
          </h1>
          <p className="mt-2 text-sm text-white/45">
            {members.length} عضو — {members.filter((member) => member.enrolled).length} بصمة مسجلة
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-3 text-sm font-extrabold text-ink lime-glow transition hover:brightness-105"
        >
          <IconPlus className="size-5" />
          إضافة عضو جديد
        </button>
      </div>

      <div className="anim-fade-up delay-1 panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <IconSearch className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو الرياضة…"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pr-11 pl-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-lime/50"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              ["all", "الكل"],
              ["player", "لاعبون"],
              ["coach", "مدربون"],
            ] as Array<["all" | Role, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRole(value)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                role === value
                  ? "bg-lime text-ink"
                  : "border border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel grid place-items-center py-20 text-center">
          <IconUsers className="size-10 text-white/20" />
          {members.length === 0 ? (
            <>
              <p className="mt-3 text-sm text-white/40">
                القائمة فاضية. أضف أول لاعب أو مدرب وابدأ تسجيل البصمة.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-xs font-extrabold text-ink transition hover:brightness-105"
              >
                <IconPlus className="size-4" />
                إضافة أول عضو
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/40">لا توجد نتائج مطابقة للبحث.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member, index) => (
            <article
              key={member.id}
              className="anim-fade-up panel panel-hover flex flex-col p-5"
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold"
                  style={{
                    background: `${member.color}20`,
                    color: member.color,
                    border: `1px solid ${member.color}35`,
                  }}
                >
                  {member.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/members/${member.id}`}
                    className="block truncate text-[15px] font-bold hover:text-lime"
                  >
                    {member.name}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
                        member.role === "coach"
                          ? "bg-gold/10 text-gold"
                          : "bg-violet-400/10 text-violet-300"
                      }`}
                    >
                      {member.role === "coach" ? (
                        <IconShield className="size-3" />
                      ) : (
                        <IconUsers className="size-3" />
                      )}
                      {ROLE_LABEL[member.role]}
                    </span>
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-white/50">
                      {member.sport}
                    </span>
                    {member.group ? (
                      <span className="rounded-full bg-lime/10 px-2 py-0.5 text-lime/80">
                        {member.group}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/members/${member.id}`}
                  aria-label={`ملف ${member.name}`}
                  className="grid size-8 place-items-center rounded-full border border-white/10 text-white/40 transition hover:border-white/25 hover:text-white"
                >
                  <IconArrowLeft className="size-4" />
                </Link>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                    member.enrolled ? "text-lime" : "text-white/35"
                  }`}
                >
                  <IconFingerprint className="size-4" />
                  {member.enrolled ? "البصمة مسجلة" : "لا توجد بصمة"}
                </span>
                {member.phone ? (
                  <span dir="ltr" className="text-[10px] tabular-nums text-white/35">
                    {member.phone}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => checkIn(member)}
                  disabled={busy === `checkin:${member.id}`}
                  title="تسجيل حضور يدوي"
                  className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition hover:border-white/25 hover:text-white"
                >
                  {busy === `checkin:${member.id}` ? (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                  ) : (
                    <IconCheck className="size-4" />
                  )}
                </button>
                <button
                  onClick={() => sendBarcode(member)}
                  disabled={(!member.phone && !member.parentPhone) || busy === `wa:${member.id}`}
                  title={
                    member.phone || member.parentPhone
                      ? "إرسال الباركود على واتساب"
                      : "أضف رقم هاتف لإرسال الباركود"
                  }
                  className="grid size-10 place-items-center rounded-xl border border-[#25d366]/25 bg-[#25d366]/[0.06] text-[#6ef0a2]/85 transition hover:border-[#25d366]/50 hover:bg-[#25d366]/[0.14] disabled:opacity-35"
                >
                  {busy === `wa:${member.id}` ? (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#6ef0a2]/25 border-t-[#6ef0a2]" />
                  ) : (
                    <IconWhatsApp className="size-4" />
                  )}
                </button>
                <Link
                  href={`/members/${member.id}/card`}
                  title="طباعة كارت الباركود"
                  className="grid size-10 place-items-center rounded-xl border border-gold/25 bg-gold/[0.06] text-gold/80 transition hover:border-gold/50 hover:text-gold"
                >
                  <IconCard className="size-4" />
                </Link>
                <button
                  onClick={() => removeMember(member)}
                  disabled={busy === `delete:${member.id}`}
                  title="حذف العضو"
                  className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/35 transition hover:border-rose-400/40 hover:text-rose-300"
                >
                  <IconTrash className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open ? (
        <div className="anim-fade fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={addMember}
            className="anim-pop panel w-full max-w-md p-6"
            style={{ background: "#0a0c12" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">إضافة عضو جديد</h2>
                <p className="mt-1 text-xs text-white/35">أضف البيانات ثم سجّل بصمته من بطاقته</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-white/10 text-white/50 hover:text-white"
              >
                <IconX className="size-4" />
              </button>
            </div>

            <label className="mb-1 block text-xs font-semibold text-white/55">الاسم الكامل</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="اسم العضو الكامل"
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
              required
              minLength={3}
            />

            <label className="mb-1 block text-xs font-semibold text-white/55">الصفة</label>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["player", "coach"] as Role[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, role: value })}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                    form.role === value
                      ? "border-lime/50 bg-lime/10 text-lime"
                      : "border-white/10 bg-white/[0.02] text-white/50"
                  }`}
                >
                  {ROLE_LABEL[value]}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs font-semibold text-white/55">الرياضة</label>
            <select
              value={form.sport}
              onChange={(event) => setForm({ ...form, sport: event.target.value as Sport })}
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-lime/50"
            >
              {SPORTS.map((sport) => (
                <option key={sport} value={sport} className="bg-[#0a0c12]">
                  {sport}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-xs font-semibold text-white/55">
              رقم الهاتف (اختياري)
            </label>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
            />

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/55">
                  المجموعة (اختياري)
                </label>
                <input
                  value={form.group}
                  onChange={(event) => setForm({ ...form, group: event.target.value })}
                  placeholder="مثال: مجموعة ٦ مساءً"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/55">
                  هاتف ولي الأمر (اختياري)
                </label>
                <input
                  value={form.parentPhone}
                  onChange={(event) => setForm({ ...form, parentPhone: event.target.value })}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-lime/50"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy === "add"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {busy === "add" ? <Spinner /> : <IconPlus className="size-4" />}
                حفظ العضو
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/55 hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`anim-toast fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur ${
            toast.kind === "ok"
              ? "border-lime/40 bg-lime/15 text-lime"
              : "border-rose-400/40 bg-rose-500/15 text-rose-200"
          }`}
        >
          {toast.kind === "ok" ? <IconCheck className="size-4" /> : <IconX className="size-4" />}
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
