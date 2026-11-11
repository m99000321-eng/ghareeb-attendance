import { getDB } from "./db";
import { waPhone } from "./format";
import type { WhatsappStatus } from "./types";

const GREEN_BASE = "https://api.green-api.com";

type SendResult =
  | { ok: true; provider: "green" | "meta"; kind: "image" | "text" }
  | { ok: false; configured: boolean; error: string };

type SendOptions = {
  barcode?: string;
};

async function barcodePng(value: string): Promise<Uint8Array> {
  const bwipjs = (await import("bwip-js/node")).default;
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: value,
    scale: 3,
    height: 22,
    includetext: true,
    textxalign: "center",
    textsize: 9,
    paddingwidth: 14,
    paddingheight: 14,
    backgroundcolor: "FFFFFF",
  });
  return new Uint8Array(png);
}

export type GreenCreds = {
  instanceId: string;
  token: string;
  source: "env" | "db";
};

export async function getGreenCreds(): Promise<GreenCreds | null> {
  const envId = process.env.GREEN_API_INSTANCE_ID?.trim();
  const envToken = process.env.GREEN_API_TOKEN?.trim();
  if (envId && envToken) {
    return { instanceId: envId, token: envToken, source: "env" };
  }
  const db = await getDB();
  const saved = db.settings?.whatsapp;
  if (saved?.instanceId && saved.token) {
    return { instanceId: saved.instanceId, token: saved.token, source: "db" };
  }
  return null;
}

function metaConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function greenState(creds: GreenCreds): Promise<string> {
  try {
    const response = await fetch(
      `${GREEN_BASE}/waInstance${creds.instanceId}/getStateInstance/${creds.token}`,
      { cache: "no-store" },
    );
    if (response.status === 401 || response.status === 403) return "unauthorized";
    const data = (await response.json().catch(() => ({}))) as {
      stateInstance?: string;
      message?: string;
    };
    if (!response.ok) {
      return data.message?.toLowerCase().includes("unauthorized") ? "unauthorized" : "error";
    }
    return data.stateInstance ?? "unknown";
  } catch {
    return "unreachable";
  }
}

async function greenPhone(creds: GreenCreds): Promise<string> {
  try {
    const response = await fetch(
      `${GREEN_BASE}/waInstance${creds.instanceId}/getSettings/${creds.token}`,
      { cache: "no-store" },
    );
    if (!response.ok) return "";
    const data = (await response.json().catch(() => ({}))) as { wid?: string };
    return typeof data.wid === "string" ? data.wid.split("@")[0] : "";
  } catch {
    return "";
  }
}

export type GreenQrResult = {
  type: string;
  image?: string;
  message?: string;
};

export async function greenQr(creds: GreenCreds): Promise<GreenQrResult> {
  try {
    const response = await fetch(
      `${GREEN_BASE}/waInstance${creds.instanceId}/qr/${creds.token}`,
      { cache: "no-store" },
    );
    const data = (await response.json().catch(() => ({}))) as {
      type?: string;
      message?: string;
    };
    const type = data.type ?? (response.ok ? "error" : "unauthorized");
    if (type !== "qrCode" || !data.message) {
      return { type, message: data.message };
    }
    const image = data.message.startsWith("data:")
      ? data.message
      : `data:image/png;base64,${data.message}`;
    return { type, image };
  } catch {
    return { type: "unreachable" };
  }
}

export async function whatsappStatus(): Promise<WhatsappStatus> {
  const green = await getGreenCreds();
  if (green) {
    const state = await greenState(green);
    return {
      configured: true,
      provider: "green",
      source: green.source,
      state,
      instanceId: green.instanceId,
      phone: state === "authorized" ? await greenPhone(green) : "",
      tokenTail: green.token.slice(-4),
    };
  }

  const meta = metaConfigured();
  return {
    configured: meta,
    provider: meta ? "meta" : null,
    source: meta ? "env" : null,
    state: meta ? "authorized" : "unconfigured",
    instanceId: "",
    phone: "",
    tokenTail: "",
  };
}

export async function sendWhatsApp(
  phone: string,
  text: string,
  options: SendOptions = {},
): Promise<SendResult> {
  const target = waPhone(phone);
  const green = await getGreenCreds();
  const configured = Boolean(green) || metaConfigured();
  if (!target || target.length < 10) {
    return { ok: false, configured, error: "رقم الواتساب غير صحيح" };
  }

  if (green) {
    if (options.barcode) {
      try {
        const png = await barcodePng(options.barcode);
        const bytes = new Uint8Array(png.length);
        bytes.set(png);
        const form = new FormData();
        form.append("chatId", `${target}@c.us`);
        form.append("file", new Blob([bytes], { type: "image/png" }), "ghareeb-card.png");
        form.append("fileName", "ghareeb-card.png");
        form.append("caption", text);
        const response = await fetch(
          `${GREEN_BASE}/waInstance${green.instanceId}/sendFileByUpload/${green.token}`,
          { method: "POST", body: form, cache: "no-store" },
        );
        const data = (await response.json().catch(() => ({}))) as { idMessage?: string };
        if (response.ok && data.idMessage) {
          return { ok: true, provider: "green", kind: "image" };
        }
      } catch {
        // Fall back to text so the member still receives the card link.
      }
    }

    try {
      const response = await fetch(
        `${GREEN_BASE}/waInstance${green.instanceId}/sendMessage/${green.token}`,
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
        error?: string;
      };
      if (!response.ok || !data.idMessage) {
        return {
          ok: false,
          configured: true,
          error: data.message ?? data.error ?? "تعذر الإرسال من Green API",
        };
      }
      return { ok: true, provider: "green", kind: "text" };
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
            components: [{ type: "body", parameters: [{ type: "text", text }] }],
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
      return { ok: true, provider: "meta", kind: "text" };
    } catch {
      return { ok: false, configured: true, error: "تعذر الاتصال بـ WhatsApp Cloud API" };
    }
  }

  return {
    ok: false,
    configured: false,
    error: "الإرسال التلقائي غير مفعّل — أضف بيانات Green API أو WhatsApp Cloud API",
  };
}

export async function logoutGreen(): Promise<boolean> {
  const creds = await getGreenCreds();
  if (!creds) return false;
  try {
    const response = await fetch(
      `${GREEN_BASE}/waInstance${creds.instanceId}/logout/${creds.token}`,
      { cache: "no-store" },
    );
    return response.ok;
  } catch {
    return false;
  }
}
