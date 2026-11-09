import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import EnrollButton from "@/components/EnrollButton";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFingerprint,
  IconShield,
  IconUsers,
} from "@/components/Icons";
import { dateArabic, getDB, timeArabic } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSession();
  const db = await getDB();
  const member = db.members.find((item) => item.id === id);
  if (!member) notFound();

  const history = db.attendance
    .filter((entry) => entry.memberId === member.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const thisMonth = history.filter((entry) => {
    const date = new Date(entry.at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <Link
          href="/members"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:border-white/25 hover:text-white"
        >
          <IconArrowLeft className="size-4 rotate-180" />
          العودة للأعضاء
        </Link>

        <section className="panel overflow-hidden">
          <div className="h-24 bg-[radial-gradient(500px_160px_at_20%_0%,rgba(200,255,46,0.18),transparent_70%)]" />
          <div className="-mt-12 flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span
                className="grid size-24 shrink-0 place-items-center rounded-3xl border text-4xl font-extrabold"
                style={{
                  background: `${member.color}1c`,
                  color: member.color,
                  borderColor: `${member.color}40`,
                }}
              >
                {member.name.slice(0, 1)}
              </span>
              <div className="pb-1">
                <h1 className="text-2xl font-extrabold md:text-3xl">{member.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold ${
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
                    {member.role === "coach" ? "مدرب" : "لاعب"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/50">
                    {member.sport}
                  </span>
                  {member.phone ? (
                    <span dir="ltr" className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 tabular-nums text-white/50">
                      {member.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="pb-2 text-[11px] text-white/35">
              عضو منذ{" "}
              {new Date(member.joinedAt).toLocaleDateString("ar-EG", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel p-5">
            <p className="text-[11px] text-white/40">إجمالي مرات الحضور</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums">{history.length}</p>
          </div>
          <div className="panel p-5">
            <p className="text-[11px] text-white/40">حضور هذا الشهر</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums">{thisMonth}</p>
          </div>
          <div className="panel p-5">
            <p className="text-[11px] text-white/40">آخر حضور</p>
            <p className="mt-2 text-lg font-bold text-lime">
              {history[0]
                ? new Date(history[0].at).toLocaleDateString("ar-EG", {
                    day: "numeric",
                    month: "short",
                  })
                : "لا يوجد"}
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          <section className="panel p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <IconFingerprint className="size-4 text-lime" />
              البصمة البيومترية
            </div>
            <div className="my-6 flex flex-col items-center gap-3 text-center">
              <span
                className={`grid size-24 place-items-center rounded-full border ${
                  member.credential
                    ? "border-lime/40 bg-lime/[0.08] text-lime"
                    : "border-white/10 bg-white/[0.03] text-white/25"
                }`}
              >
                <IconFingerprint className="size-12" />
              </span>
              <p className="text-sm font-bold">
                {member.credential ? "بصمة مسجلة ونشطة" : "لم تُسجّل البصمة بعد"}
              </p>
              <p className="text-[11px] leading-relaxed text-white/35">
                {member.credential
                  ? `تم التسجيل في ${new Date(member.credential.createdAt).toLocaleDateString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`
                  : "سجّل بصمة العضو ليعتمد على إصبعه في تسجيل الحضور من شاشة الكشك."}
              </p>
            </div>
            <EnrollButton
              memberId={member.id}
              memberName={member.name}
              enrolled={Boolean(member.credential)}
            />
          </section>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h2 className="text-base font-bold">سجل الحضور</h2>
                <p className="mt-1 text-[11px] text-white/35">آخر ٢٠ عملية</p>
              </div>
              <IconCalendar className="size-5 text-white/25" />
            </div>
            <div className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
              {history.length === 0 ? (
                <p className="px-6 py-14 text-center text-sm text-white/30">لا يوجد حضور مسجل.</p>
              ) : (
                history.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-6 py-3.5">
                    <span className="grid size-9 place-items-center rounded-xl border border-lime/15 bg-lime/[0.05] text-lime">
                      <IconCheck className="size-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{dateArabic(entry.at)}</p>
                      <p className="text-[10px] text-white/35">
                        {entry.method === "fingerprint" ? "بصمة إصبع" : "تسجيل يدوي"}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs tabular-nums text-white/50">
                      <IconClock className="size-3.5" />
                      {timeArabic(entry.at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
