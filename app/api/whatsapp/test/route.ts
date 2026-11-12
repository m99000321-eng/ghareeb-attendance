import { denyApi, isApiAuthorized } from "@/lib/guard";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const body = (await request.json().catch(() => ({}))) as { phone?: string };
  const phone = body.phone?.trim() ?? "";
  if (!phone) {
    return Response.json({ error: "اكتب رقم للاختبار" }, { status: 400 });
  }

  const result = await sendWhatsApp(
    phone,
    "رسالة من أكاديمية الغريب — الإرسال شغال ✅",
  );
  if (!result.ok) {
    return Response.json(
      { error: result.error, configured: result.configured },
      { status: result.configured ? 502 : 503 },
    );
  }
  return Response.json({ ok: true, provider: result.provider });
}
