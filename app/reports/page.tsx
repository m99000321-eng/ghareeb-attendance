import Link from "next/link";
import Shell from "@/components/Shell";
import {
  IconArrowLeft,
  IconCalendar,
  IconChart,
  IconCheck,
  IconDownload,
  IconWallet,
  IconX,
} from "@/components/Icons";
import { dayKey, getDB, todayKey } from "@/lib/db";
import { money, monthKey, monthLabel, waLink } from "@/lib/format";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; group?: string }>;
}) {
  const params = await searchParams;
  await requireSession();

  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? (params.month as string) : monthKey();
  const group = params.group ?? "";
  const today = todayKey();

  const db = await getDB();
  const memberById = new Map(db.members.map((member) => [member.id, member]));
  const groups = [...new Set(db.members.map((member) => member.group).filter(Boolean))] as string[];

  const monthEntries = db.attendance.filter((entry) => dayKey(entry.at).startsWith(month));
  const scopedEntries = monthEntries.filter((entry) => {
    if (!group) return true;
    return memberById.get(entry.memberId)?.group === group;
  });

  const sessionsByGroup = new Map<string, Set<string>>();
  monthEntries.forEach((entry) => {
    const key = memberById.get(entry.memberId)?.group ?? "";
    const set = sessionsByGroup.get(key) ?? new Set<string>();
    set.add(dayKey(entry.at));
    sessionsByGroup.set(key, set);
  });
  const allSessions = new Set(monthEntries.map((entry) => dayKey(entry.at)));

  const presentByMember = new Map<string, Set<string>>();
  scopedEntries.forEach((entry) => {
    const set = presentByMember.get(entry.memberId) ?? new Set<string>();
    set.add(dayKey(entry.at));
    presentByMember.set(entry.memberId, set);
  });

  const scopedMembers = db.members
    .filter((member) => !group || member.group === group)
    .sort((a, b) => a.name.localeCompare(b.name, "ar"))
    .map((member) => {
      const sessions = sessionsByGroup.get(member.group ?? "") ?? allSessions;
      const present = presentByMember.get(member.id)?.size ?? 0;
      const absent = Math.max(sessions.size - present, 0);
      return {
        member,
        sessions: sessions.size,
        present,
        absent,
        rate: sessions.size ? Math.round((present / sessions.size) * 100) : 0,
      };
    });

  const totalPresent = scopedMembers.reduce((sum, row) => sum + row.present, 0);
  const totalAbsent = scopedMembers.reduce((sum, row) => sum + row.absent, 0);
  const attendanceRate = totalPresent + totalAbsent
    ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
    : 0;

  const scopedSubscriptions = db.subscriptions.filter(
    (item) =>
      item.month === month &&
      (!group || memberById.get(item.memberId)?.group === group),
  );
  const collected = scopedSubscriptions
    .filter((item) => item.paid)
    .reduce((sum, item) => sum + item.amount, 0);
  const outstanding = scopedSubscriptions
    .filter((item) => !item.paid)
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = db.expenses
    .filter((item) => item.at.startsWith(month))
    .reduce((sum, item) => sum + item.amount, 0);

  const todayAbsent = db.members.filter((member) => {
    if (group && member.group !== group) return false;
    const hasSessionToday = db.attendance.some(
      (entry) => entry.memberId === member.id && dayKey(entry.at) === today,
    );
    const groupHadSession = [...(sessionsByGroup.get(member.group ?? "") ?? allSessions)].includes(today);
    return groupHadSession && !hasSessionToday;
  });

  const exportQuery = `month=${month}${group ? `&group=${encodeURIComponent(group)}` : ""}`;

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">
              REPORTS &amp; EXPORTS
            </p>
            <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
              التقارير التفصيلية
            </h1>
            <p className="mt-2 text-sm text-white/45">
              {monthLabel(month)}
              {group ? ` — ${group}` : " — كل المجموعات"}
            </p>
          </div>

          <form method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            />
            <select
              name="group"
              defaultValue={group}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-lime/50"
            >
              <option value="">كل المجموعات</option>
              {groups.map((item) => (
                <option key={item} value={item} className="bg-[#0a0c12]">
                  {item}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-lime px-4 py-2.5 text-xs font-extrabold text-ink transition hover:brightness-105"
            >
              تحديث
            </button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-lime/25 bg-lime/10 text-lime">
              <IconCheck className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">نسبة الحضور</p>
              <p className="text-2xl font-extrabold tabular-nums">{attendanceRate}%</p>
            </div>
          </div>
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-300">
              <IconX className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">إجمالي الغياب</p>
              <p className="text-2xl font-extrabold tabular-nums">{totalAbsent}</p>
            </div>
          </div>
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
              <IconWallet className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">المحصّل / المتبقي</p>
              <p className="text-lg font-extrabold tabular-nums">
                {money(collected)}
                <span className="mx-1 text-white/25">/</span>
                <span className="text-rose-300">{money(outstanding)}</span>
              </p>
            </div>
          </div>
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
              <IconChart className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">المصروفات / الصافي</p>
              <p className="text-lg font-extrabold tabular-nums text-rose-300">
                {money(expenses)}
                <span className="mx-1 text-white/25">/</span>
                <span className={collected - expenses >= 0 ? "text-lime" : "text-rose-300"}>
                  {money(collected - expenses)}
                </span>
              </p>
            </div>
          </div>
        </div>

        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
            <div>
              <h2 className="text-base font-bold">الحضور والغياب حسب العضو</h2>
              <p className="mt-1 text-[11px] text-white/35">
                الغياب محسوب على أيام حصص مجموعة العضو خلال الشهر
              </p>
            </div>
            <IconCalendar className="size-5 text-white/25" />
          </div>
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 border-b border-white/[0.05] bg-black/20 px-6 py-3 text-[10px] font-semibold tracking-wider text-white/30 md:grid">
            <span>العضو</span>
            <span>المجموعة</span>
            <span>حضور</span>
            <span>غياب</span>
            <span>النسبة</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {scopedMembers.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-white/35">
                لا يوجد أعضاء في هذا النطاق.
              </p>
            ) : (
              scopedMembers.map(({ member, sessions, present, absent, rate }) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="grid gap-2 px-6 py-3.5 transition hover:bg-white/[0.025] md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] md:items-center"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-extrabold"
                      style={{ background: `${member.color}22`, color: member.color }}
                    >
                      {member.name.slice(0, 1)}
                    </span>
                    <span className="truncate text-sm font-bold">{member.name}</span>
                  </span>
                  <span className="text-xs text-white/45">{member.group || "—"}</span>
                  <span className="text-xs tabular-nums text-lime">
                    {present}
                    <span className="text-white/25"> / {sessions}</span>
                  </span>
                  <span className="text-xs tabular-nums text-rose-300/80">{absent}</span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.07]">
                      <span
                        className="block h-full rounded-full bg-lime"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </span>
                    <span className="text-[10px] tabular-nums text-white/45">{rate}%</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-base font-bold">غائب اليوم — تواصل واتساب</h2>
            <p className="mt-1 text-[11px] text-white/35">
              الأعضاء اللي ليهم حصة اليوم ولم يتم تسجيل حضورهم
            </p>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {todayAbsent.length === 0 ? (
              <p className="text-sm text-white/35">لا يوجد غياب اليوم.</p>
            ) : (
              todayAbsent.map((member) => {
                const phone = member.parentPhone || member.phone;
                if (!phone) {
                  return (
                    <span
                      key={member.id}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold text-white/40"
                      title="أضف رقم ولي الأمر من صفحة الأعضاء"
                    >
                      {member.name}
                      <span className="text-[9px] text-white/25">بدون رقم</span>
                    </span>
                  );
                }
                return (
                  <a
                    key={member.id}
                    href={waLink(
                      phone,
                      `مرحباً، ${member.name} لم يحضر حصة اليوم في أكاديمية الغريب. للتواصل: `,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/[0.06] px-3.5 py-2 text-[12px] font-semibold text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-500/[0.12]"
                  >
                    {member.name}
                    <span className="text-[9px] text-white/35">واتساب</span>
                  </a>
                );
              })
            )}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-bold">تصدير البيانات إلى Excel</h2>
          <p className="mt-1 text-[11px] text-white/35">
            ملفات جاهزة بترويسات عربية — {monthLabel(month)}
            {group ? ` — ${group}` : ""}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { type: "attendance", label: "سجل الحضور" },
              { type: "subscriptions", label: "الاشتراكات" },
              { type: "expenses", label: "المصروفات" },
              { type: "grades", label: "الدرجات" },
            ].map((item) => (
              <a
                key={item.type}
                href={`/api/export?type=${item.type}&${exportQuery}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-white/70 transition hover:border-lime/40 hover:text-lime"
              >
                {item.label}
                <IconDownload className="size-4" />
              </a>
            ))}
          </div>
        </section>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-xs text-white/35 transition hover:text-white"
        >
          <IconArrowLeft className="size-4 rotate-180" />
          العودة للوحة التحكم
        </Link>
      </div>
    </Shell>
  );
}
