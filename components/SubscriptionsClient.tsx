"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SafeMember, Subscription } from "@/lib/types";
import { TIER_LABEL, TIER_PRICE, money, monthLabel } from "@/lib/format";
import { IconCheck, IconDownload, IconTrash, IconUpload, IconWallet, IconX } from "./Icons";

type ImportReport = {
  created: number;
  updated: number;
  skipped: { row: number; name: string; reason: string }[];
  unpaid: { name: string; amount: number }[];
};

function Spinner() {
  return (
    <span className="inline-block size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
  );
}

export default function SubscriptionsClient({
  members,
  subscriptions,
  month,
}: {
  members: SafeMember[];
  subscriptions: Subscription[];
  month: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(subscriptions);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const byMember = useMemo(
    () => new Map(rows.filter((item) => item.month === month).map((item) => [item.memberId, item])),
    [rows, month],
  );

  const totals = useMemo(() => {
    let expected = 0;
    let collected = 0;
    members.forEach((member) => {
      const record = byMember.get(member.id);
      if (!record) return;
      expected += record.amount;
      if (record.paid) collected += record.amount;
    });
    return { expected, collected, remaining: expected - collected };
  }, [members, byMember]);

  const unpaid = useMemo(
    () =>
      members
        .map((member) => ({ member, record: byMember.get(member.id) }))
        .filter((item) => item.record && !item.record.paid),
    [members, byMember],
  );

  function notify(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function importExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    setReport(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("month", month);
      const response = await fetch("/api/subscriptions/import", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "تعذر استيراد الملف");
      setReport({
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        skipped: data.skipped ?? [],
        unpaid: data.unpaid ?? [],
      });
      if (Array.isArray(data.subscriptions)) {
        setRows(data.subscriptions as Subscription[]);
      }
      notify(
        "ok",
        `تم الاستيراد — تحديث ${data.updated ?? 0} وإنشاء ${data.created ?? 0} اشتراك`,
      );
      router.refresh();
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setImporting(false);
    }
  }

  async function save(member: SafeMember, amount: number) {
    setBusy(`save:${member.id}`);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, month, amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ الاشتراك");
      setRows((current) => [
        ...current.filter((item) => item.id !== data.subscription.id),
        data.subscription as Subscription,
      ]);
      notify("ok", `تم حفظ اشتراك ${member.name}`);
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function togglePaid(record: Subscription) {
    setBusy(`paid:${record.id}`);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, paid: !record.paid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر تحديث الحالة");
      setRows((current) =>
        current.map((item) => (item.id === record.id ? (data.subscription as Subscription) : item)),
      );
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(record: Subscription) {
    if (!window.confirm("حذف سجل الاشتراك لهذا الشهر؟")) return;
    setBusy(`del:${record.id}`);
    try {
      const response = await fetch(`/api/subscriptions?id=${record.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("تعذر حذف الاشتراك");
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
            MONTHLY SUBSCRIPTIONS
          </p>
          <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
            الاشتراكات الشهرية
          </h1>
          <p className="mt-2 text-sm text-white/45">{monthLabel(month)}</p>
          <p className="mt-1 text-[11px] text-white/30">
            الاشتراك الشهري: الصغار ٥٠٠ ج.م — الكبار ٧٠٠ ج.م
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(event) => router.push(`/subscriptions?month=${event.target.value}`)}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
          />
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-lime/30 bg-lime/[0.08] px-4 py-2.5 text-xs font-bold text-lime transition hover:bg-lime/[0.15] ${
              importing ? "opacity-60" : ""
            }`}
          >
            {importing ? <Spinner /> : <IconUpload className="size-4" />}
            {importing ? "جاري الاستيراد…" : "استيراد Excel"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={importExcel}
              disabled={importing}
            />
          </label>
          <a
            href={`/api/export?type=subscriptions-template&month=${month}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:border-white/25 hover:text-white"
          >
            <IconDownload className="size-4" />
            قالب Excel
          </a>
          <a
            href={`/api/export?type=subscriptions&month=${month}`}
            className="flex items-center gap-2 rounded-xl border border-lime/30 bg-lime/[0.08] px-4 py-2.5 text-xs font-bold text-lime transition hover:bg-lime/[0.15]"
          >
            <IconDownload className="size-4" />
            تصدير Excel
          </a>
        </div>
      </div>

      <div className="anim-fade-up delay-1 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="text-[11px] text-white/40">المطلوب</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{money(totals.expected)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-[11px] text-white/40">المحصّل</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-lime">
            {money(totals.collected)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-[11px] text-white/40">المتبقي</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-rose-300">
            {money(totals.remaining)}
          </p>
        </div>
      </div>

      {unpaid.length > 0 ? (
        <div className="anim-pop rounded-2xl border border-rose-400/30 bg-rose-500/[0.07] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-rose-200">
            <IconWallet className="size-4" />
            {unpaid.length} عضو ما دفعش اشتراك {monthLabel(month)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {unpaid.map(({ member, record }) => (
              <span
                key={member.id}
                className="rounded-full border border-rose-400/25 bg-black/20 px-3 py-1 text-[11px] text-rose-100/80"
              >
                {member.name} — {money(record?.amount ?? 0)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {report ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lime">تم تحديث {report.updated}</span>
            <span className="text-lime">تم إنشاء {report.created}</span>
            {report.skipped.length > 0 ? (
              <span className="text-rose-300">{report.skipped.length} صف لم يُستورد</span>
            ) : null}
          </div>
          {report.skipped.length > 0 ? (
            <ul className="mt-2 space-y-1 text-rose-200/70">
              {report.skipped.map((item) => (
                <li key={`${item.row}-${item.name}`}>
                  صف {item.row}: {item.name} — {item.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <section className="anim-fade-up delay-2 panel overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_0.9fr] gap-3 border-b border-white/[0.05] bg-black/20 px-6 py-3 text-[10px] font-semibold tracking-wider text-white/30 md:grid">
          <span>العضو</span>
          <span>الفئة / المجموعة</span>
          <span>المبلغ الشهري</span>
          <span>الحالة</span>
          <span />
        </div>
        <div className="divide-y divide-white/[0.05]">
          {members.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-white/35">
              أضف أعضاء أولاً من صفحة اللاعبين والمدربين.
            </p>
          ) : (
            members.map((member) => (
              <SubscriptionRow
                key={member.id}
                member={member}
                record={byMember.get(member.id)}
                busy={busy}
                onSave={save}
                onToggle={togglePaid}
                onRemove={remove}
              />
            ))
          )}
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

function SubscriptionRow({
  member,
  record,
  busy,
  onSave,
  onToggle,
  onRemove,
}: {
  member: SafeMember;
  record?: Subscription;
  busy: string | null;
  onSave: (member: SafeMember, amount: number) => void;
  onToggle: (record: Subscription) => void;
  onRemove: (record: Subscription) => void;
}) {
  const tier = member.tier ?? "junior";
  const [amount, setAmount] = useState(
    record ? String(record.amount) : String(TIER_PRICE[tier]),
  );

  return (
    <div className="grid gap-3 px-6 py-3.5 md:grid-cols-[2fr_1.2fr_1fr_1fr_0.9fr] md:items-center">
      <span className="flex items-center gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-extrabold"
          style={{ background: `${member.color}22`, color: member.color }}
        >
          {member.name.slice(0, 1)}
        </span>
        <span className="truncate text-sm font-bold">{member.name}</span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5 text-xs text-white/45">
        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold/80">
          {TIER_LABEL[tier]}
        </span>
        {member.group || "—"}
      </span>
      <span className="flex items-center gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
          inputMode="numeric"
          placeholder="0"
          className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm tabular-nums outline-none focus:border-lime/50"
        />
        <button
          onClick={() => onSave(member, Number(amount || 0))}
          disabled={busy === `save:${member.id}` || amount === ""}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-bold text-white/60 transition hover:border-lime/40 hover:text-lime disabled:opacity-40"
        >
          {busy === `save:${member.id}` ? <Spinner /> : "حفظ"}
        </button>
      </span>
      <span>
        {record ? (
          <button
            onClick={() => onToggle(record)}
            disabled={busy === `paid:${record.id}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
              record.paid
                ? "bg-lime/12 text-lime hover:bg-lime/20"
                : "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
            }`}
          >
            {busy === `paid:${record.id}` ? (
              <Spinner />
            ) : record.paid ? (
              <IconCheck className="size-3" />
            ) : (
              <IconWallet className="size-3" />
            )}
            {record.paid ? "مدفوع" : "غير مدفوع"}
          </button>
        ) : (
          <span className="text-[10px] text-white/25">لم يُسجّل</span>
        )}
      </span>
      <span className="flex justify-end">
        {record ? (
          <button
            onClick={() => onRemove(record)}
            disabled={busy === `del:${record.id}`}
            title="حذف السجل"
            className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/30 transition hover:border-rose-400/40 hover:text-rose-300"
          >
            <IconTrash className="size-3.5" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
