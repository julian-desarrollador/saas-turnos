const E164 = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(raw: string): string | null {
  const compact = raw.trim().replace(/[^\d+]/g, "");
  if (!compact) {
    return null;
  }

  let candidate: string;
  if (compact.startsWith("+")) {
    candidate = `+${compact.slice(1).replace(/\D/g, "")}`;
  } else {
    const digits = compact.replace(/\D/g, "");
    if (digits.startsWith("54")) {
      candidate = `+${digits}`;
    } else if (digits.length === 10) {
      candidate = `+549${digits}`;
    } else if (digits.length >= 8 && digits.length <= 15) {
      candidate = `+${digits}`;
    } else {
      return null;
    }
  }

  return E164.test(candidate) ? candidate : null;
}

/** URL de chat en WhatsApp (wa.me) a partir de un teléfono crudo o E.164. */
export function whatsAppChatUrl(raw: string): string | null {
  const phone = normalizePhone(raw);
  if (!phone) {
    return null;
  }
  return `https://wa.me/${phone.slice(1)}`;
}
