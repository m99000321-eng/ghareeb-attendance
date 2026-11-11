"use client";

import { useMemo, useState } from "react";
import type { Announcement, SafeMember } from "@/lib/types";
import { waLink } from "@/lib/format";
import { IconBell, IconCheck, IconTrash, IconX } from "./Icons";

function Spinner() {
  return (
    <span className="inline-block size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
  );
}

export default function AnnouncementsClient({
  members,
  initial,
}: {
  members: SafeMember[];
  initial: Announcement[];
}) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ title: "", body: "", group: "" });

  const groups = useMemo(
    () => [...new Set(members.map((member) => member.group).filter(Boolean))] as string[],
    [members],
  );

  function notify(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    setBusy("add");
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          group: form.group || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر نشر التنبيه");
      setRows((current) => [data.announcement as Announcement, ...current]);
      setForm({ title: "", body: "", group: form.group });
      notify("ok", "تم نشر التنبيه");
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(record: Announcement) {
    if (!window.confirm("حذف التنبيه؟")) return;
    setBusy(`del:${record.id}`);
    try {
      const response = await fetch(`/api/announcements?id=${record.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("تعذر حذف التنبيه");
      setRows((current) => current.filter((item) => item.id !== record.id));
    } catch (error) {
      notify("err", (error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="anim-fade-up">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">
          ANNOUNCEMENTS
        </p>
        <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
          تنبيهات المجموعات
        </h1>
        <p className="mt-2 text-sm text-white/45">
          أعلن إلغاء الحصة أو تغيير المواعيد، وابعتها لأولياء الأمور على واتساب.
        </p>
      </div>

      <div className="anim-fade-up delay-1 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <form onSubmit={publish} className="panel flex flex-col gap-3 p-5">
          <p className="text-sm font-bold">تنبيه جديد</p>
          <select
            value={form.group}
            onChange={(event) => setForm({ ...form, group: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
          >
            <option value="">كل المجموعات</option>
            {groups.map((group) => (
              <option key={group} value={group} className="bg-[#0a0c12]">
                {group}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="عنوان التنبيه (مثال: إلغاء حصة اليوم)"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            required
          />
          <textarea
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            placeholder="نص الرسالة لأولياء الأمور…"
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-relaxed outline-none focus:border-lime/50"
            required
          />
          <button
            type="submit"
            disabled={busy === "add"}
            className="flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold text-ink transition hover:brightness-105 disabled:opacity-60"
          >
            {busy === "add" ? <Spinner /> : <IconBell className="size-4" />}
            نشر التنبيه
          </button>
        </form>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-base font-bold">التنبيهات المنشورة</h2>
            <p className="mt-1 text-[11px] text-white/35">{rows.length} تنبيه</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {rows.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-white/35">لا توجد تنبيهات بعد.</p>
            ) : (
              rows.map((record) => (
                <article key={record.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-lime/15 bg-lime/[0.06] text-lime">
                      <IconBell className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{record.title}</p>
                      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-white/50">
                        {record.body}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/30">
                        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-white/45">
                          {record.group || "كل المجموعات"}
                        </span>
                        {new Date(`${record.at.slice(0, 10)}T12:00:00`).toLocaleDateString("ar-EG", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(record)}
                      disabled={busy === `del:${record.id}`}
                      title="حذف"
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-white/30 transition hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <IconTrash className="size-3.5" />
                    </button>
                  </div>
                  <ShareRow record={record} members={members} />
                </article>
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

function ShareRow({ record, members }: { record: Announcement; members: SafeMember[] }) {
  const recipients = members.filter((member) => {
    if (record.group && member.group !== record.group) return false;
    return Boolean(member.parentPhone || member.phone);
  });

  const message = `${record.title}\n\n${record.body}\n\n— أكاديمية الغريب`;

  if (recipients.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-[11px] text-white/30">
        لا توجد أرقام واتساب مسجلة لهذه المجموعة. أضف «هاتف ولي الأمر» من صفحة الأعضاء.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <p className="mb-2 text-[11px] text-white/35">
        إرسال على واتساب — اضغط اسم ولي الأمر ({recipients.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {recipients.map((member) => (
          <a
            key={member.id}
            href={waLink(member.parentPhone || member.phone, message)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-lime/20 bg-lime/[0.05] px-2.5 py-1 text-[11px] text-lime/85 transition hover:border-lime/50 hover:bg-lime/[0.12]"
          >
            {member.name}
          </a>
        ))}
      </div>
    </div>
  );
}
