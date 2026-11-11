import { denyApi, isApiAuthorized } from "@/lib/guard";
import { getGreenCreds, logoutGreen } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const creds = await getGreenCreds();
  if (!creds) {
    return Response.json({ error: "مفيش حساب واتساب مربوط" }, { status: 400 });
  }

  const ok = await logoutGreen();
  if (!ok) {
    return Response.json(
      { error: "تعذر فصل الربط — حاول تاني بعد شوية" },
      { status: 502 },
    );
  }
  return Response.json({ ok: true });
}
