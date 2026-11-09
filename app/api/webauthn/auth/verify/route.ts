import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { getDB, safeMember, saveDB } from "@/lib/db";
import { jsonError, rpContext } from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    requestId?: string;
    response?: AuthenticationResponseJSON;
  };

  if (!body.response) return jsonError("بيانات البصمة غير مكتملة");

  const db = await getDB();
  const member = db.members.find((item) => item.credential?.id === body.response!.id);
  if (!member || !member.credential) {
    return jsonError("هذه البصمة غير مسجلة في النظام. سجّل البصمة من صفحة العضو أولاً", 404);
  }

  const saved = body.requestId ? db.challenges[body.requestId] : undefined;
  if (!saved || saved.expires < Date.now()) {
    return jsonError("انتهت صلاحية الطلب، أعد المحاولة");
  }

  const { origin, rpID } = rpContext(request);

  try {
    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: saved.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: member.credential.id,
        publicKey: Buffer.from(member.credential.publicKey, "base64url"),
        counter: member.credential.counter,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return jsonError("تعذر التحقق من البصمة");
    }

    member.credential.counter = verification.authenticationInfo.newCounter;
    delete db.challenges[body.requestId!];

    const now = new Date();
    const latest = db.attendance
      .filter((entry) => entry.memberId === member.id)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
    const alreadyCheckedIn = Boolean(
      latest && now.getTime() - new Date(latest.at).getTime() < 60_000,
    );

    if (!alreadyCheckedIn) {
      db.attendance.push({
        id: `a_${crypto.randomUUID().slice(0, 8)}`,
        memberId: member.id,
        at: now.toISOString(),
        method: "fingerprint",
      });
    }

    await saveDB(db);

    return Response.json({
      ok: true,
      member: safeMember(member),
      at: now.toISOString(),
      alreadyCheckedIn,
    });
  } catch (error) {
    console.error("auth verify failed", error);
    return jsonError("فشل التحقق من البصمة. حاول مرة أخرى", 500);
  }
}
