import { getDB, saveDB } from "@/lib/db";
import { denyApi, isApiAuthorized } from "@/lib/guard";
import { greenState, whatsappStatus } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  return Response.json(await whatsappStatus());
}

export async function POST(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();

  const body = (await request.json().catch(() => ({}))) as {
    instanceId?: string;
    token?: string;
  };
  const instanceId = body.instanceId?.trim() ?? "";
  const token = body.token?.trim() ?? "";

  if (!/^\d{4,}$/.test(instanceId)) {
    return Response.json({ error: "idInstance لازم يكون رقم صحيح من صفحة Green API" }, { status: 400 });
  }
  if (token.length < 12) {
    return Response.json({ error: "apiTokenInstance غير صحيح — انسخه كامل" }, { status: 400 });
  }

  const state = await greenState({ instanceId, token, source: "db" });
  if (state === "unauthorized") {
    return Response.json(
      { error: "المفاتيح غير صحيحة — راجع idInstance و apiTokenInstance" },
      { status: 400 },
    );
  }
  if (state === "unreachable" || state === "error") {
    return Response.json(
      { error: "تعذر الوصول إلى Green API — تأكد من الإنترنت وحاول تاني" },
      { status: 502 },
    );
  }

  const db = await getDB();
  db.settings ??= {};
  db.settings.whatsapp = { instanceId, token, updatedAt: new Date().toISOString() };
  await saveDB(db);

  return Response.json({ ok: true, state });
}

export async function DELETE(request: Request) {
  if (!(await isApiAuthorized(request))) return denyApi();
  if (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN) {
    return Response.json(
      { error: "المفاتيح محفوظة في إعدادات السيرفر — امحيها من Vercel" },
      { status: 409 },
    );
  }

  const db = await getDB();
  if (db.settings?.whatsapp) {
    delete db.settings.whatsapp;
    await saveDB(db);
  }
  return Response.json({ ok: true });
}
