// lib/whatsapp.ts

type WhatsAppSendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; status?: number };

type WhatsAppSuccessResponse = {
  messages?: Array<{ id?: string }>;
};

function toE164ZA(raw: string): string | null {
  // Very simple SA normalizer:
  // 0721234567 -> 27721234567
  // +27721234567 -> 27721234567
  // 27721234567 -> 27721234567
  const s = String(raw || "").trim();
  if (!s) return null;

  const digits = s.replace(/\D/g, "");

  // Already starts with 27 and has typical length 11-12 digits
  if (digits.startsWith("27") && digits.length >= 11 && digits.length <= 12) return digits;

  // Starts with 0 (local)
  if (digits.startsWith("0") && digits.length === 10) return "27" + digits.slice(1);

  // If user typed 7xxxxxxxx (missing 0)
  if (!digits.startsWith("0") && digits.length === 9) return "27" + digits;

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function sendWhatsAppText(toPhoneRaw: string, message: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, error: "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars" };
  }

  const to = toE164ZA(toPhoneRaw);
  if (!to) return { ok: false, error: "Invalid phone number format" };

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    const parsed: unknown = await res.json().catch(() => ({}));

    if (!res.ok) {
      let msg = "WhatsApp send failed";
      if (isObject(parsed) && isObject(parsed.error) && typeof parsed.error.message === "string") {
        msg = parsed.error.message;
      }
      return { ok: false, error: msg, status: res.status };
    }

    // success response shape: { messages: [{ id: "..." }] }
    let id: string | undefined;
    if (isObject(parsed) && Array.isArray((parsed as WhatsAppSuccessResponse).messages)) {
      const first = (parsed as WhatsAppSuccessResponse).messages?.[0];
      if (first && typeof first.id === "string") id = first.id;
    }

    return { ok: true, id };
  } catch {
    return { ok: false, error: "Network error sending WhatsApp message" };
  }
}

export function waLink(toPhoneRaw: string, message: string) {
  const digits = String(toPhoneRaw || "").replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}