import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const secret = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-insecure-session-secret-change-me");
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set and at least 16 characters in production.");
  }
  return secret;
}

export function signValue(value: string) {
  const sig = createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

export function verifySignedValue(signed: string) {
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = createHmac("sha256", getSecret()).update(value).digest("hex");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return value;
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
