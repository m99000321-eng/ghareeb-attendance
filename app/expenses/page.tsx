import Shell from "@/components/Shell";
import ExpensesClient from "@/components/ExpensesClient";
import { getDB } from "@/lib/db";
import { monthKey } from "@/lib/format";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  await requireSession();
  const selected = /^\d{4}-\d{2}$/.test(month ?? "") ? (month as string) : monthKey();

  const db = await getDB();
  const expenses = [...db.expenses].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <Shell>
      <ExpensesClient initial={expenses} month={selected} />
    </Shell>
  );
}
