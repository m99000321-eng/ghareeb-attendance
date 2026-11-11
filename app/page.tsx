import Link from "next/link";
import Shell from "@/components/Shell";
import LiveClock from "@/components/LiveClock";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import {
  IconBell,
  IconCalendar,
  IconChart,
  IconCheck,
  IconFingerprint,
  IconScan,
  IconShield,
  IconSpark,
  IconUsers,
  IconWallet,
} from "@/components/Icons";
import { dayKey, getDB, timeArabic, todayKey } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "lime",
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ReactNode;
  accent?: "lime" | "gold" | "violet" | "cyan";
}) {
  const tones: Record<string, string> = {
    lime: "bg-lime/12 text-lime border-lime/25",
    gold: "bg-gold/12 text-gold border-gold/25",
    violet: "bg-violet-500/12 text-violet-300 border-violet-400/25",
    cyan: "bg-cyan-400/12 text-cyan-300 border-cyan-400/25",
  };
  return (
    <div className="panel panel-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-white/45">{label}</p>
          <p className="mt-2 text-[30px] font-extrabold leading-none tabular-nums">{value}</p>
        </div>
        <span className={`grid size-11 place-items-center rounded-2xl border ${tones[accent]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-white/35">{hint}</p>
    </div>
  );
}

export default async function DashboardPage() {
  await requireSession();
  const db = await getDB();
  const total = db.members.length;
  const players = db.members.filter((member) => member.role === "player").length;
  const coaches = total - players;
  const enrolled = db.members.filter((member) => member.credential).length;

  const today = todayKey();
  const todayEntries = db.attendance.filter((entry) => dayKey(entry.at) === today);
  const presentIds = new Set(todayEntries.map((entry) => entry.memberId));
  const present = presentIds.size;

  const byId = new Map<string, Member>(db.members.map((member) => [member.id, member]));
  const recent = [...db.attendance]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7)
    .map((entry) => ({ ...entry, member: byId.get(entry.memberId) }));

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toLocaleDateString("en-CA");
    const count = db.attendance.filter((entry) => dayKey(entry.at) === key).length;
    return {
      key,
      day: date.toLocaleDateString("ar-EG", { weekday: "short" }),
      count,
      today: key === today,
    };
  });
  const maxWeek = Math.max(...week.map((item) => item.count), 1);
  const enrollRate = total ? Math.round((enrolled / total) * 100) : 0;

  return (
    <Shell>
      <div className="flex flex-col gap-7">
        <Reveal>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.06] px-3 py-1.5 text-[11px] font-semibold text-lime">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
              </span>
              النظام متصل — البصمة جاهزة
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight md:text-[38px]">
              لوحة تحكم الأكاديمية
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
              متابعة حضور اللاعبين والمدربين عبر البصمة البيومترية، وإدارة تسجيل البصمات من مكان واحد.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <LiveClock />
            <Link
              href="/scan"
              className="hidden items-center gap-2 rounded-2xl border border-lime/30 bg-lime/[0.08] px-5 py-3.5 text-sm font-bold text-lime transition hover:bg-lime/[0.15] md:flex"
            >
              <IconScan className="size-5" />
              حضور بالباركود
            </Link>
            <Link
              href="/kiosk"
              className="hidden items-center gap-2 rounded-2xl bg-lime px-5 py-3.5 text-sm font-extrabold text-ink lime-glow transition hover:brightness-105 md:flex"
            >
              <IconFingerprint className="size-5" />
              شاشة البصمة
            </Link>
          </div>
        </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Reveal delay={60}>
            <StatCard
              label="حضور اليوم"
              value={<CountUp value={present} />}
              hint={`${todayEntries.length} بصمة مسجلة اليوم`}
              icon={<IconCheck className="size-5" />}
            />
          </Reveal>
          <Reveal delay={140}>
            <StatCard
              label="اللاعبون"
              value={<CountUp value={players} />}
              hint="رياضيون مسجلون في الأكاديمية"
              icon={<IconUsers className="size-5" />}
              accent="violet"
            />
          </Reveal>
          <Reveal delay={220}>
            <StatCard
              label="المدربون"
              value={<CountUp value={coaches} />}
              hint="طاقم التدريب المعتمد"
              icon={<IconShield className="size-5" />}
              accent="gold"
            />
          </Reveal>
          <Reveal delay={300}>
            <StatCard
              label="بصمات مسجلة"
              value={<CountUp value={enrolled} />}
              hint={`${total - enrolled} عضو يحتاج تسجيل البصمة`}
              icon={<IconFingerprint className="size-5" />}
              accent="cyan"
            />
          </Reveal>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/scan",
              label: "الحضور بالباركود",
              hint: "كاميرا الموبايل",
              icon: <IconScan className="size-4" />,
            },
            {
              href: "/subscriptions",
              label: "الاشتراكات",
              hint: "تحصيل الشهر",
              icon: <IconWallet className="size-4" />,
            },
            {
              href: "/announcements",
              label: "تنبيهات واتساب",
              hint: "إلغاء الحصص",
              icon: <IconBell className="size-4" />,
            },
            {
              href: "/reports",
              label: "التقارير و Excel",
              hint: "حضور وغياب",
              icon: <IconChart className="size-4" />,
            },
          ].map((item, index) => (
            <Reveal key={item.href} delay={index * 70}>
              <Link
                href={item.href}
                className="panel panel-hover flex h-full items-center gap-3 px-4 py-3.5"
              >
                <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.07] text-lime">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold">{item.label}</span>
                  <span className="block text-[10px] text-white/35">{item.hint}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <Reveal className="h-full">
          <section className="panel h-full p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">حركة الحضور — آخر ٧ أيام</h2>
                <p className="mt-1 text-xs text-white/35">إجمالي البصمات اليومية</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/45">
                {db.attendance.length} سجل إجمالي
              </span>
            </div>
            <div className="flex h-[210px] items-end gap-3 sm:gap-5">
              {week.map((item, index) => (
                <div key={item.key} className="group flex flex-1 flex-col items-center gap-2">
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      item.today ? "text-lime" : "text-white/40"
                    }`}
                  >
                    {item.count}
                  </span>
                  <div className="flex h-[160px] w-full items-end">
                    <div
                      className={`bar-rise w-full rounded-t-xl transition-all group-hover:brightness-125 ${
                        item.today
                          ? "bg-gradient-to-t from-lime/40 to-lime"
                          : "bg-gradient-to-t from-white/[0.04] to-white/20"
                      }`}
                      style={{
                        height: `${Math.max(8, (item.count / maxWeek) * 100)}%`,
                        animationDelay: `${index * 70}ms`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[11px] ${item.today ? "font-bold text-lime" : "text-white/35"}`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
          </Reveal>

          <Reveal delay={120} className="h-full">
          <section className="panel flex h-full flex-col p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <IconSpark className="size-4 text-lime" />
              حالة تسجيل البصمات
            </div>
            <div className="my-6 flex items-center justify-center gap-6">
              <div
                className="relative grid size-[132px] place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#c8ff2e ${enrollRate}%, rgba(255,255,255,0.07) 0)`,
                }}
              >
                <div className="grid size-[104px] place-items-center rounded-full bg-[#0a0c12] text-center">
                  <div>
                    <p className="text-2xl font-extrabold">
                      <CountUp value={enrollRate} suffix="%" />
                    </p>
                    <p className="text-[10px] text-white/35">نسبة التسجيل</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[11px] text-white/35">مسجلة بصمتهم</p>
                  <p className="font-bold text-lime">{enrolled} عضو</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/35">بانتظار التسجيل</p>
                  <p className="font-bold text-white/70">{total - enrolled} عضو</p>
                </div>
              </div>
            </div>
            <Link
              href="/members"
              className="mt-auto flex items-center justify-center gap-2 rounded-2xl border border-lime/25 bg-lime/[0.07] px-4 py-3 text-sm font-bold text-lime transition hover:bg-lime/[0.12]"
            >
              <IconFingerprint className="size-4" />
              إدارة بصمات الأعضاء
            </Link>
          </section>
          </Reveal>
        </div>

        <Reveal>
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-lg font-bold">آخر عمليات الحضور</h2>
              <p className="mt-1 text-xs text-white/35">مباشر من شاشة البصمة</p>
            </div>
            <Link
              href="/attendance"
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
            >
              <IconCalendar className="size-4" />
              السجل الكامل
            </Link>
          </div>
          <div className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
            {recent.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-white/35">لا توجد عمليات حضور بعد.</p>
            ) : (
              recent.map((entry) => {
                const member = entry.member;
                const color = member?.color ?? "#c8ff2e";
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-6 py-3.5">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold"
                      style={{ background: `${color}22`, color }}
                    >
                      {member?.name?.slice(0, 1) ?? "؟"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {member?.name ?? "عضو محذوف"}
                      </p>
                      <p className="text-[11px] text-white/35">
                        {member?.role === "coach" ? "مدرب" : "لاعب"} — {member?.sport ?? ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-white/45">
                      {entry.method === "fingerprint"
                        ? "بصمة"
                        : entry.method === "barcode"
                          ? "باركود"
                          : "يدوي"}
                    </span>
                    <span className="w-16 text-left text-xs tabular-nums text-white/50">
                      {timeArabic(entry.at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
        </Reveal>
      </div>
    </Shell>
  );
}
