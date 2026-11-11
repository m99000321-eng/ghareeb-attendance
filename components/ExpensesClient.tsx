"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense } from "@/lib/types";
import { money, monthLabel } from "@/lib/format";
import { IconCheck, IconDownload, IconPlus, IconTrash, IconX } from "./Icons";

const CATEGORIES = ["إيجار", "رواتب", "معدات", "كهرباء ومياه", "تسويق", "عام"];

export default function ExpensesClient({
  initial,
  month,
}: {
  initial: Expense[];
  month: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "عام",
    at: new Date().toLocaleDateString("en-CA"),
  });

  const monthRows = useMemo(
    () => rows.filter((item) => item.at.startsWith(month)),
    [rows, month],
  );

  const total = monthRows.reduce((sum, item) => sum + item.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthRows.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthRows]);

  function notify(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy("add");
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر إضافة المصروف");
      setRows((current) => [data.expense as Expense, ...current]);
      setForm({ ...form, title: "", amount: "" });
      notify("ok", "تم إضافة المصروف");
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(record: Expense) {
    if (!window.confirm(`حذف مصروف «${record.title}»؟`)) return;
    setBusy(`del:${record.id}`);
    try {
      const response = await fetch(`/api/expenses?id=${record.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("تعذر حذف المصروف");
      setRows((current) => current.filter((item) => item.id !== record.id));
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
            EXPENSES
          </p>
          <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">المصروفات</h1>
          <p className="mt-2 text-sm text-white/45">{monthLabel(month)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(event) => router.push(`/expenses?month=${event.target.value}`)}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
          />
          <a
            href={`/api/export?type=expenses&month=${month}`}
            className="flex items-center gap-2 rounded-xl border border-lime/30 bg-lime/[0.08] px-4 py-2.5 text-xs font-bold text-lime transition hover:bg-lime/[0.15]"
          >
            <IconDownload className="size-4" />
            تصدير Excel
          </a>
        </div>
      </div>

      <div className="anim-fade-up delay-1 grid gap-4 lg:grid-cols-[1.1fr_2fr]">
        <form onSubmit={add} className="panel flex flex-col gap-3 p-5">
          <p className="text-sm font-bold">إضافة مصروف</p>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="بيان المصروف"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.amount}
              onChange={(event) =>
                setForm({ ...form, amount: event.target.value.replace(/[^\d.]/g, "") })
              }
              placeholder="المبلغ"
              inputMode="numeric"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm tabular-nums outline-none focus:border-lime/50"
              required
            />
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category} className="bg-[#0a0c12]">
                  {category}
                </option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={form.at}
            onChange={(event) => setForm({ ...form, at: event.target.value })}
            className="date-field w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
          />
          <button
            type="submit"
            disabled={busy === "add"}
            className="flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
          >
            <IconPlus className="size-4" />
            إضافة
          </button>

          <div className="mt-2 rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[11px] text-white/40">إجمالي الشهر</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-rose-300">{money(total)}</p>
            <div className="mt-3 space-y-1.5">
              {byCategory.length === 0 ? (
                <p className="text-[11px] text-white/25">لا توجد مصروفات هذا الشهر.</p>
              ) : (
                byCategory.map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between text-[11px]">
                    <span className="text-white/45">{category}</span>
                    <span className="tabular-nums text-white/65">{money(value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-base font-bold">سجل المصروفات</h2>
            <p className="mt-1 text-[11px] text-white/35">{monthRows.length} عملية</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {monthRows.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-white/35">
                لا توجد مصروفات مسجلة في هذا الشهر.
              </p>
            ) : (
              monthRows.map((record) => (
                <div key={record.id} className="flex items-center gap-3 px-6 py-3.5">
                  <span className="grid size-9 place-items-center rounded-xl border border-rose-400/15 bg-rose-500/[0.06] text-rose-300/80">
                    <IconDownload className="size-4 rotate-180" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{record.title}</p>
                    <p className="text-[10px] text-white/35">
                      {record.category} —{" "}
                      {new Date(`${record.at.slice(0, 10)}T12:00:00`).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-rose-300">
                    {money(record.amount)}
                  </span>
                  <button
                    onClick={() => remove(record)}
                    disabled={busy === `del:${record.id}`}
                    title="حذف"
                    className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/30 transition hover:border-rose-400/40 hover:text-rose-300"
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

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
