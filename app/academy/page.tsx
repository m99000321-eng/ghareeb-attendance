import Link from "next/link";
import Shell from "@/components/Shell";
import AddMemberForm from "@/components/AddMemberForm";
import { IconArrowLeft, IconCalendar, IconChart, IconUsers } from "@/components/Icons";
import { getDB } from "@/lib/db";
import { requireSession } from "@/lib/guard";
export const dynamic="force-dynamic";
export default async function AcademyPage(){await requireSession();const db=await getDB();
const cards=[{n:db.members.length,t:"الأشخاص",h:"كل الأشخاص المسجلين",href:"#add-member",i:<IconUsers className="size-5"/>},{n:db.attendance.length,t:"الحضور",h:"كل سجلات الحضور",href:"/attendance",i:<IconCalendar className="size-5"/>},{n:db.announcements.length,t:"التنبيهات",h:"آخر التنبيهات",href:"/announcements",i:<IconChart className="size-5"/>}];
return <Shell><div className="flex flex-col gap-6">
<div className="anim-fade-up"><p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-lime/80">GHAREEB ACADEMY</p><h1 className="text-[30px] font-extrabold md:text-[38px]">الأكاديمية</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">المكان الرئيسي لإدارة الأشخاص والحضور والأنشطة اليومية من نفس الواجهة.</p></div>
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(x=><Link key={x.href} href={x.href} className="panel panel-hover p-5"><div className="flex items-start justify-between"><span><span className="block text-[12px] text-white/40">{x.t}</span><span className="mt-2 block text-3xl font-extrabold">{x.n}</span><span className="mt-2 block text-[11px] text-white/30">{x.h}</span></span><span className="grid size-11 place-items-center rounded-2xl border border-lime/20 bg-lime/[0.06] text-lime">{x.i}</span></div></Link>)}</div>
<div id="add-member" className="panel p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">إضافة شخص جديد</h2><p className="mt-1 text-xs text-white/35">أضف لاعبًا أو مدربًا مباشرة من الأكاديمية.</p></div><IconArrowLeft className="size-5 text-white/25"/></div><div className="mt-5"><AddMemberForm/></div></div>
<div className="grid gap-3 sm:grid-cols-2"><Link href="/scan" className="panel panel-hover p-4 text-sm font-bold text-white/65 hover:text-lime">تسجيل الحضور بالباركود</Link><Link href="/reports" className="panel panel-hover p-4 text-sm font-bold text-white/65 hover:text-lime">التقارير</Link></div>
</div></Shell>;}
