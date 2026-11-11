import Link from "next/link";
import { notFound } from "next/navigation";
import MemberCard from "@/components/MemberCard";
import { getDB, safeMember } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function MemberCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSession();
  const db = await getDB();
  const member = db.members.find((item) => item.id === id);
  if (!member) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <Link href="/members" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center overflow-hidden rounded-xl border border-gold/30 bg-black/40">
            <img src="/brand/logo.png" alt="الغريب" className="size-9 object-contain" />
          </span>
          <span>
            <span className="block text-sm font-extrabold">كارت العضو</span>
            <span className="block text-[10px] tracking-[0.2em] text-gold/70">
              MEMBER CARD
            </span>
          </span>
        </Link>
        <span className="text-[11px] text-white/35">أكاديمية الغريب</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <MemberCard member={safeMember(member)} />
      </main>
    </div>
  );
}
