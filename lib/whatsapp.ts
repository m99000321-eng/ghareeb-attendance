import { waPhone } from "./format";

type SendResult =
  | { ok: true; provider: "green" | "meta" }
  | { ok: false; configured: boolean; error: string };

export function whatsappConfigured(): boolean {
  return Boolean(
    (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN) ||
      (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  );
}

export async function sendWhatsApp(phone: string, text: string): Promise<SendResult> {
  const target = waPhone(phone);
  if (!target || target.length < 10) {
    return { ok: false, configured: whatsappConfigured(), error: "رقم الواتساب غير صحيح" };
  }

  const greenId = process.env.GREEN_API_INSTANCE_ID;
  const greenToken = process.env.GREEN_API_TOKEN;
  if (greenId && greenToken) {
    try {
      const response = await fetch(
        `https://api.green-api.com/waInstance${greenId}/sendMessage/${greenToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: `${target}@c.us`, message: text }),
          cache: "no-store",
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        idMessage?: string;
        message?: string;
      };
      if (!response.ok || !data.idMessage) {
        return {
          ok: false,
          configured: true,
          error: data.message ?? "تعذر الإرسال من Green API",
        };
      }
      return { ok: true, provider: "green" };
    } catch {
      return { ok: false, configured: true, error: "تعذر الاتصال بـ Green API" };
    }
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (token && phoneId) {
    const template = process.env.WHATSAPP_TEMPLATE_NAME;
    const language = process.env.WHATSAPP_TEMPLATE_LANG || "ar";
    const payload = template
      ? {
          messaging_product: "whatsapp",
          to: target,
          type: "template",
          template: {
            name: template,
            language: { code: language },
            components: [
              { type: "body", parameters: [{ type: "text", text }] },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: target,
          type: "text",
          text: { preview_url: true, body: text },
        };

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        return {
          ok: false,
          configured: true,
          error: data.error?.message ?? "تعذر الإرسال من WhatsApp Cloud API",
        };
      }
      return { ok: true, provider: "meta" };
    } catch {
      return { ok: false, configured: true, error: "تعذر الاتصال بـ WhatsApp Cloud API" };
    }
  }

  return {
    ok: false,
    configured: false,
    error: "الإرسال التلقائي غير مفعّل — أضف بيانات Green API أو WhatsApp Cloud API على السيرفر",
  };
}
