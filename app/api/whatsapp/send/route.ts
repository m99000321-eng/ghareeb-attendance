import { barcodeMessage, memberCardUrl } from "@/lib/format";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import { getDB } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const body = (await request.json().catch(() => ({}))) as {
    memberId?: string;
    phone?: string;
  };

  const db = await getDB();
  const member = body.memberId
    ? db.members.find((item) => item.id === body.memberId)
    : undefined;
  if (!member) {
    return Response.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  const phone = body.phone?.trim() || member.phone || member.parentPhone || "";
  if (!phone) {
    return Response.json({ error: "لا يوجد رقم واتساب لهذا العضو" }, { status: 400 });
  }

  if (!member.barcodeToken) {
    return Response.json({ error: "رابط الباركود غير جاهز" }, { status: 400 });
  }

  const cardUrl = memberCardUrl(new URL(request.url).origin, member.barcodeToken);
  const result = await sendWhatsApp(phone, barcodeMessage(member, cardUrl));

  if (!result.ok) {
    return Response.json(
      { error: result.error, configured: result.configured },
      { status: result.configured ? 502 : 503 },
    );
  }

  return Response.json({ ok: true, provider: result.provider });
}
