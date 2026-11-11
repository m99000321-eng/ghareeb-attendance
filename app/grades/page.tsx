import Shell from "@/components/Shell";
import GradesClient from "@/components/GradesClient";
import { getDB, safeMember } from "@/lib/db";
import { monthKey } from "@/lib/format";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  await requireSession();
  const selected = /^\d{4}-\d{2}$/.test(month ?? "") ? (month as string) : monthKey();

  const db = await getDB();
  const members = [...db.members]
    .sort((a, b) => a.name.localeCompare(b.name, "ar"))
    .map(safeMember);
  const grades = [...db.grades].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <Shell>
      <GradesClient members={members} initial={grades} month={selected} />
    </Shell>
  );
}
