import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MemberCard from "@/components/MemberCard";
import { getDB, safeMember } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "كارت العضوية | أكاديمية الغريب",
  robots: { index: false, follow: false },
};

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-z0-9]{16,32}$/i.test(token)) notFound();

  const db = await getDB();
  const member = db.members.find((item) => item.barcodeToken === token);
  if (!member) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-center gap-3 border-b border-white/[0.07] px-5 py-4">
        <span className="grid size-10 place-items-center overflow-hidden rounded-xl border border-gold/30 bg-black/40">
          <img src="/brand/logo.png" alt="الغريب" className="size-9 object-contain" />
        </span>
        <span className="text-center">
          <span className="block text-sm font-extrabold">كارت العضوية الرقمي</span>
          <span className="block text-[10px] tracking-[0.2em] text-gold/70">GHAREEB ACADEMY</span>
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <MemberCard member={safeMember(member)} publicView />
      </main>
    </div>
  );
}
