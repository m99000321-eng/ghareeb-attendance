import Link from "next/link";
import Shell from "@/components/Shell";
import AddMemberForm from "@/components/AddMemberForm";
import { IconCalendar, IconScan, IconUsers } from "@/components/Icons";
import { getDB } from "@/lib/db";
import { requireSession } from "@/lib/guard";
export const dynamic="force-dynamic";
export default async function ArenaPage(){await requireSession();const db=await getDB();const today=new Date().toLocaleDateString("en-CA");const todayAttendance=db.attendance.filter(a=>new Date(a.at).toLocaleDateString("en-CA")===today).length;
return <Shell><div className="flex flex-col gap-6">
<div className="anim-fade-up"><p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">THE ARENA</p><h1 className="text-[30px] font-extrabold md:text-[38px]">الساحة</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">واجهة سريعة للحركة اليومية داخل الأكاديمية: الحضور وإضافة الأشخاص والأنشطة.</p></div>
<div className="grid gap-4 sm:grid-cols-2"><Link href="/scan" className="panel panel-hover p-6"><IconScan className="size-6 text-lime"/><h2 className="mt-4 text-lg font-bold">تسجيل حضور سريع</h2><p className="mt-1 text-xs text-white/35">افتح الكاميرا وسجل الحضور بالباركود.</p></Link><div className="panel panel-hover p-6"><IconUsers className="size-6 text-violet-300"/><h2 className="mt-4 text-lg font-bold">إضافة أشخاص</h2><p className="mt-1 text-xs text-white/35">أضف الأشخاص مباشرة من الساحة.</p></div></div>
<div className="grid gap-4 sm:grid-cols-2"><div className="panel p-5"><p className="text-xs text-white/35">حضور اليوم</p><p className="mt-2 text-4xl font-extrabold">{todayAttendance}</p><p className="mt-2 text-[11px] text-white/30">عملية حضور مسجلة اليوم</p></div><div className="panel p-5"><p className="text-xs text-white/35">إجمالي الأشخاص</p><p className="mt-2 text-4xl font-extrabold">{db.members.length}</p><p className="mt-2 text-[11px] text-white/30">أشخاص مسجلون في الأكاديمية</p></div></div>
<div className="panel p-6"><h2 className="text-lg font-bold">إضافة شخص جديد</h2><p className="mt-1 text-xs text-white/35">أضف البيانات من الساحة وسيظهر الشخص في الأكاديمية.</p><div className="mt-5"><AddMemberForm/></div></div>
<Link href="/attendance" className="flex items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-3 text-sm font-extrabold text-ink lime-glow"><IconCalendar className="size-5"/>فتح سجل الحضور</Link>
</div></Shell>;}
