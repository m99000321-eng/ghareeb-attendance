import { ensureBarcodeToken, getDB, safeMember, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import type { Member, Role, Sport, Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLORS = ["#c8ff2e", "#8b5cf6", "#22d3ee", "#ff7a18", "#f472b6", "#d9b45b"];
const SPORTS: Sport[] = ["ملاكمة", "كيك بوكس", "كونغ فو", "MMA"];

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const db = await getDB();
  return Response.json({ members: db.members.map(safeMember) });
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as {
    name?: string;
    role?: Role;
    sport?: Sport;
    phone?: string;
    parentPhone?: string;
    group?: string;
    tier?: Tier;
  };

  const name = body.name?.trim();
  if (!name || name.length < 3) {
    return Response.json({ error: "اكتب اسم العضو بشكل صحيح" }, { status: 400 });
  }

  const role: Role = body.role === "coach" ? "coach" : "player";
  const sport: Sport = SPORTS.includes(body.sport as Sport) ? (body.sport as Sport) : "MMA";
  const tier: Tier = body.tier === "senior" ? "senior" : "junior";

  const db = await getDB();
  const member: Member = {
    id: `m_${crypto.randomUUID().slice(0, 8)}`,
    name,
    role,
    sport,
    tier,
    phone: body.phone?.trim() ?? "",
    parentPhone: body.parentPhone?.trim() ?? "",
    group: body.group?.trim() ?? "",
    joinedAt: new Date().toISOString(),
    color: COLORS[db.members.length % COLORS.length],
  };
  ensureBarcodeToken(member);
  db.members.push(member);
  await saveDB(db);

  return Response.json({ member: safeMember(member) }, { status: 201 });
}
