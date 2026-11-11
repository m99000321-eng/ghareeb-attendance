import { denyApi, isApiAuthorized } from "@/lib/guard";
import { getGreenCreds, greenQr } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const creds = await getGreenCreds();
  if (!creds) {
    return Response.json({ error: "أضف مفاتيح Green API أولاً" }, { status: 400 });
  }

  return Response.json(await greenQr(creds));
}
