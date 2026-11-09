import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import { jsonError, rpContext } from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  const body = (await request.json()) as {
    memberId?: string;
    requestId?: string;
    response?: RegistrationResponseJSON;
  };

  const db = await getDB();
  const member = db.members.find((item) => item.id === body.memberId);
  if (!member) return jsonError("العضو غير موجود", 404);

  const saved = body.requestId ? db.challenges[body.requestId] : undefined;
  if (!saved || saved.expires < Date.now() || saved.userId !== member.id) {
    return jsonError("انتهت صلاحية الطلب، أعد المحاولة");
  }
  if (!body.response) return jsonError("بيانات البصمة غير مكتملة");

  const { origin, rpID } = rpContext(request);

  try {
    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: saved.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError("تعذر التحقق من البصمة، حاول مرة أخرى");
    }

    const { credential } = verification.registrationInfo;
    member.credential = {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      createdAt: new Date().toISOString(),
    };
    delete db.challenges[body.requestId!];
    await saveDB(db);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("register verify failed", error);
    return jsonError("فشل تسجيل البصمة. تأكد من إعداد بصمة الجهاز ثم أعد المحاولة", 500);
  }
}
