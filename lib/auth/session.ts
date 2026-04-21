const SESSION_TTL_SECONDS = 60 * 60 * 12;

export const SESSION_COOKIE_NAME = "meta_lab_session";

interface SessionPayload {
  username: string;
  exp: number;
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || "meta-lab-dev-secret-change-me";
}

async function signData(data: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function encodePayload(payload: SessionPayload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodePayload(payload: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(payload)) as SessionPayload;

    if (
      !parsed ||
      typeof parsed.username !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function createSessionToken(username: string) {
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encoded = encodePayload(payload);
  const signature = await signData(encoded, getAuthSecret());

  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = await signData(encoded, getAuthSecret());

  if (signature !== expected) {
    return null;
  }

  const payload = decodePayload(encoded);

  if (!payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    return null;
  }

  return payload;
}

export function getSessionCookieMaxAge() {
  return SESSION_TTL_SECONDS;
}
