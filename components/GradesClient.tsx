"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Grade, SafeMember } from "@/lib/types";
import { percent } from "@/lib/format";
import { IconChart, IconCheck, IconDownload, IconPlus, IconTrash, IconX } from "./Icons";

function Spinner() {
  return (
    <span className="inline-block size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
  );
}

const LEVELS = [
  { min: 85, label: "متقدم", className: "bg-lime/12 text-lime" },
  { min: 60, label: "متوسط", className: "bg-gold/12 text-gold" },
  { min: 0, label: "مبتدئ", className: "bg-white/[0.06] text-white/55" },
];

export default function GradesClient({
  members,
  initial,
  month,
}: {
  members: SafeMember[];
  initial: Grade[];
  month: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [group, setGroup] = useState("all");
  const [form, setForm] = useState({
    memberId: members[0]?.id ?? "",
    title: "",
    score: "",
    max: "100",
    at: new Date().toLocaleDateString("en-CA"),
  });

  const groups = useMemo(
    () => [...new Set(members.map((member) => member.group).filter(Boolean))] as string[],
    [members],
  );

  const visibleMembers = useMemo(
    () =>
      members.filter(
        (member) => group === "all" || member.group === group,
      ),
    [members, group],
  );

  const monthRows = useMemo(
    () => rows.filter((item) => item.at.startsWith(month)),
    [rows, month],
  );

  const averages = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    rows.forEach((grade) => {
      const current = map.get(grade.memberId) ?? { total: 0, count: 0 };
      current.total += percent(grade.score, grade.max);
      current.count += 1;
      map.set(grade.memberId, current);
    });
    return map;
  }, [rows]);

  function notify(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy("add");
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          score: Number(form.score),
          max: Number(form.max),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر تسجيل الدرجة");
      setRows((current) => [data.grade as Grade, ...current]);
      setForm({ ...form, title: "", score: "" });
      notify("ok", "تم تسجيل الدرجة");
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(record: Grade) {
    if (!window.confirm("حذف هذه الدرجة؟")) return;
    setBusy(`del:${record.id}`);
    try {
      const response = await fetch(`/api/grades?id=${record.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("تعذر حذف الدرجة");
      setRows((current) => current.filter((item) => item.id !== record.id));
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const nameOf = (id: string) => members.find((member) => member.id === id)?.name ?? "عضو محذوف";

  return (
    <div className="flex flex-col gap-6">
      <div className="anim-fade-up flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">
            EXAMS &amp; LEVELS
          </p>
          <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
            الدرجات والمستوى
          </h1>
          <p className="mt-2 text-sm text-white/45">
            {monthRows.length} درجة مسجلة هذا الشهر
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(event) => router.push(`/grades?month=${event.target.value}`)}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
          />
          <a
            href={`/api/export?type=grades&month=${month}`}
            className="flex items-center gap-2 rounded-xl border border-lime/30 bg-lime/[0.08] px-4 py-2.5 text-xs font-bold text-lime transition hover:bg-lime/[0.15]"
          >
            <IconDownload className="size-4" />
            تصدير Excel
          </a>
        </div>
      </div>

      <div className="anim-fade-up delay-1 grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <form onSubmit={add} className="panel flex flex-col gap-3 p-5">
          <p className="text-sm font-bold">تسجيل درجة اختبار</p>
          <select
            value={form.memberId}
            onChange={(event) => setForm({ ...form, memberId: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            required
          >
            {members.length === 0 ? <option value="">لا يوجد أعضاء</option> : null}
            {members.map((member) => (
              <option key={member.id} value={member.id} className="bg-[#0a0c12]">
                {member.name}
                {member.group ? ` — ${member.group}` : ""}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="اسم الاختبار (مثال: اختبار الحزام)"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.score}
              onChange={(event) =>
                setForm({ ...form, score: event.target.value.replace(/[^\d.]/g, "") })
              }
              placeholder="الدرجة"
              inputMode="numeric"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm tabular-nums outline-none focus:border-lime/50"
              required
            />
            <input
              value={form.max}
              onChange={(event) =>
                setForm({ ...form, max: event.target.value.replace(/[^\d.]/g, "") })
              }
              placeholder="من"
              inputMode="numeric"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm tabular-nums outline-none focus:border-lime/50"
              required
            />
          </div>
          <input
            type="date"
            value={form.at}
            onChange={(event) => setForm({ ...form, at: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
          />
          <button
            type="submit"
            disabled={busy === "add" || members.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {busy === "add" ? <Spinner /> : <IconPlus className="size-4" />}
            حفظ الدرجة
          </button>
        </form>

        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <IconChart className="size-5 text-white/30" />
              <h2 className="text-base font-bold">درجات الشهر</h2>
            </div>
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-lime/50"
            >
              <option value="all">كل المجموعات</option>
              {groups.map((item) => (
                <option key={item} value={item} className="bg-[#0a0c12]">
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {monthRows.filter((grade) => {
              const member = members.find((item) => item.id === grade.memberId);
              return group === "all" || member?.group === group;
            }).length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-white/35">
                لا توجد درجات مسجلة في هذا الشهر.
              </p>
            ) : (
              monthRows
                .filter((grade) => {
                  const member = members.find((item) => item.id === grade.memberId);
                  return group === "all" || member?.group === group;
                })
                .map((grade) => {
                  const value = percent(grade.score, grade.max);
                  return (
                    <div key={grade.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="grid size-9 place-items-center rounded-full bg-white/[0.05] text-xs font-extrabold text-white/60">
                        {nameOf(grade.memberId).slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{nameOf(grade.memberId)}</p>
                        <p className="text-[10px] text-white/35">
                          {grade.title} —{" "}
                          {new Date(`${grade.at.slice(0, 10)}T12:00:00`).toLocaleDateString("ar-EG", {
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                      <span className="text-xs tabular-nums text-white/55">
                        {grade.score} / {grade.max}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums ${
                          value >= 85
                            ? "bg-lime/10 text-lime"
                            : value >= 60
                              ? "bg-gold/10 text-gold"
                              : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {value}%
                      </span>
                      <button
                        onClick={() => remove(grade)}
                        disabled={busy === `del:${grade.id}`}
                        title="حذف"
                        className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/30 transition hover:border-rose-400/40 hover:text-rose-300"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </section>
      </div>

      <section className="anim-fade-up delay-2 panel overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-bold">مستوى الأعضاء</h2>
          <p className="mt-1 text-[11px] text-white/35">
            متوسط جميع درجات العضو — متقدم من ٨٥٪، متوسط من ٦٠٪
          </p>
        </div>
        <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-3">
          {visibleMembers.map((member) => {
            const stats = averages.get(member.id);
            const average = stats ? Math.round(stats.total / stats.count) : null;
            const level = LEVELS.find((item) => (average ?? 0) >= item.min) ?? LEVELS[2];
            return (
              <div key={member.id} className="flex items-center gap-3 bg-[#080a10] px-5 py-4">
                <span
                  className="grid size-10 place-items-center rounded-xl text-sm font-extrabold"
                  style={{ background: `${member.color}20`, color: member.color }}
                >
                  {member.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{member.name}</p>
                  <p className="text-[10px] text-white/35">
                    {member.group || "بدون مجموعة"} — {stats?.count ?? 0} اختبار
                  </p>
                </div>
                {average === null ? (
                  <span className="text-[10px] text-white/25">لا درجات</span>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${level.className}`}>
                    {level.label} · {average}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {toast ? (
        <div
          className={`anim-toast fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur ${
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
