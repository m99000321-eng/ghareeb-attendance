import Link from "next/link";
import Shell from "@/components/Shell";
import AttendanceTools from "@/components/AttendanceTools";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFingerprint,
  IconScan,
  IconShield,
  IconUsers,
} from "@/components/Icons";
import { dayKey, getDB, timeArabic, todayKey } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; group?: string }>;
}) {
  const { date, group: groupParam } = await searchParams;
  await requireSession();
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? (date as string) : todayKey();
  const group = groupParam?.trim() ?? "";

  const db = await getDB();
  const groups = [...new Set(db.members.map((member) => member.group).filter(Boolean))] as string[];
  const memberById = new Map(db.members.map((member) => [member.id, member]));
  const entries = db.attendance
    .filter((entry) => dayKey(entry.at) === selected)
    .filter((entry) => !group || memberById.get(entry.memberId)?.group === group)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const uniqueMembers = new Set(entries.map((entry) => entry.memberId));
  const coachesPresent = entries.filter(
    (entry) => memberById.get(entry.memberId)?.role === "coach",
  ).length;
  const playersPresent = entries.length - coachesPresent;

  const rows = entries.map((entry) => {
    const member = memberById.get(entry.memberId);
    return {
      id: entry.id,
      memberId: entry.memberId,
      name: member?.name ?? "عضو محذوف",
      role: member?.role === "coach" ? "مدرب" : "لاعب",
      sport: member?.sport ?? "",
      color: member?.color ?? "#c8ff2e",
      time: timeArabic(entry.at),
      method:
        entry.method === "fingerprint"
          ? "بصمة"
          : entry.method === "barcode"
            ? "باركود"
            : "يدوي",
    };
  });

  const displayDate = new Date(`${selected}T12:00:00`).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">
              ATTENDANCE LOG
            </p>
            <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">سجل الحضور</h1>
            <p className="mt-2 text-sm text-white/45">
              {displayDate}
              {group ? ` — ${group}` : " — كل المجموعات"}
            </p>
          </div>
          <AttendanceTools date={selected} group={group} groups={groups} rows={rows} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-lime/25 bg-lime/10 text-lime">
              <IconCheck className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">عمليات الحضور</p>
              <p className="text-2xl font-extrabold tabular-nums">{entries.length}</p>
            </div>
          </div>
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
              <IconUsers className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">أعضاء حاضرون</p>
              <p className="text-2xl font-extrabold tabular-nums">{uniqueMembers.size}</p>
            </div>
          </div>
          <div className="panel flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
              <IconShield className="size-5" />
            </span>
            <div>
              <p className="text-[11px] text-white/40">لاعبون / مدربون</p>
              <p className="text-2xl font-extrabold tabular-nums">
                {playersPresent}
                <span className="mx-1 text-sm font-medium text-white/30">/</span>
                {coachesPresent}
              </p>
            </div>
          </div>
        </div>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2">
              <IconCalendar className="size-5 text-white/30" />
              <h2 className="text-base font-bold">تفاصيل اليوم</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/scan"
                className="flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.08] px-4 py-2 text-xs font-bold text-lime transition hover:bg-lime/[0.15]"
              >
                <IconScan className="size-4" />
                مسح باركود
              </Link>
              <Link
                href="/kiosk"
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-white/25 hover:text-white"
              >
                <IconFingerprint className="size-4" />
                شاشة البصمة
              </Link>
            </div>
          </div>

          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-3 border-y border-white/[0.05] bg-black/20 px-6 py-3 text-[10px] font-semibold tracking-wider text-white/30 md:grid">
            <span>العضو</span>
            <span>الصفة</span>
            <span>الرياضة</span>
            <span>الوقت</span>
            <span>الطريقة</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {rows.length === 0 ? (
              <div className="grid place-items-center py-20 text-center">
                <IconClock className="size-9 text-white/15" />
                <p className="mt-3 text-sm text-white/35">لا يوجد حضور مسجل في هذا اليوم.</p>
              </div>
            ) : (
              rows.map((row) => (
                <Link
                  key={row.id}
                  href={`/members/${row.memberId}`}
                  className="grid gap-2 px-6 py-3.5 transition hover:bg-white/[0.025] md:grid-cols-[2fr_1fr_1fr_1fr_0.5fr] md:items-center"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-extrabold"
                      style={{ background: `${row.color}22`, color: row.color }}
                    >
                      {row.name.slice(0, 1)}
                    </span>
                    <span className="truncate text-sm font-bold">{row.name}</span>
                  </span>
                  <span className="text-xs text-white/45">{row.role}</span>
                  <span className="text-xs text-white/45">{row.sport}</span>
                  <span className="flex items-center gap-1.5 text-xs tabular-nums text-white/55">
                    <IconClock className="size-3.5 text-white/25" />
                    {row.time}
                  </span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      row.method === "بصمة"
                        ? "bg-lime/10 text-lime"
                        : row.method === "باركود"
                          ? "bg-violet-400/10 text-violet-300"
                          : "bg-white/[0.05] text-white/45"
                    }`}
                  >
                    {row.method}
                  </span>
                </Link>
              ))
            )}
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
