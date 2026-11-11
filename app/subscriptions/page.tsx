import Shell from "@/components/Shell";
import SubscriptionsClient from "@/components/SubscriptionsClient";
import { getDB, safeMember } from "@/lib/db";
import { monthKey } from "@/lib/format";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage({
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

  return (
    <Shell>
      <SubscriptionsClient
        members={members}
        subscriptions={db.subscriptions}
        month={selected}
      />
    </Shell>
  );
}
