import Shell from "@/components/Shell";
import AnnouncementsClient from "@/components/AnnouncementsClient";
import { getDB, safeMember } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  await requireSession();
  const db = await getDB();
  const members = [...db.members]
    .sort((a, b) => a.name.localeCompare(b.name, "ar"))
    .map(safeMember);
  const announcements = [...db.announcements].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <Shell>
      <AnnouncementsClient members={members} initial={announcements} />
    </Shell>
  );
}
