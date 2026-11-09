import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import { jsonError, rpContext } from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as { memberId?: string };
  const db = await getDB();
  const member = db.members.find((item) => item.id === body.memberId);
  if (!member) return jsonError("العضو غير موجود", 404);
  if (member.credential) return jsonError("هذا العضو لديه بصمة مسجلة بالفعل");

  const { rpID } = rpContext(request);

  const options = await generateRegistrationOptions({
    rpName: "الغريب | نظام البصمة",
    rpID,
    userID: new TextEncoder().encode(member.id),
    userName: member.phone || member.id,
    userDisplayName: member.name,
    attestationType: "none",
    excludeCredentials: [],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  });

  const requestId = crypto.randomUUID();
  db.challenges[requestId] = {
    challenge: options.challenge,
    userId: member.id,
    expires: Date.now() + 5 * 60_000,
  };
  await saveDB(db);

  return Response.json({ options, requestId });
}
