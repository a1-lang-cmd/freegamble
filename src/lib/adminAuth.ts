import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_COOKIE = "freegamble_admin";
const sessionMaxAgeSeconds = 12 * 60 * 60;

function getAdminKeys() {
  const keys = [process.env.FREEGAMBLE_ADMIN_KEY, process.env.FREEGAMBLE_ADMIN_KEYS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return keys;
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signSession(timestamp: string, key: string) {
  return createHmac("sha256", key).update(`freegamble-admin:${timestamp}`).digest("base64url");
}

export function hasAdminKeyConfigured() {
  return getAdminKeys().length > 0;
}

export function validateAdminKey(input: string) {
  return getAdminKeys().some((key) => safeEquals(input, key));
}

export function createAdminCookieValue() {
  const keys = getAdminKeys();
  const timestamp = String(Date.now());
  return `${timestamp}.${signSession(timestamp, keys[0])}`;
}

export function isValidAdminCookie(value?: string) {
  if (!value) return false;
  const [timestamp, signature] = value.split(".");
  const createdAt = Number(timestamp);
  if (!timestamp || !signature || !Number.isFinite(createdAt)) return false;
  if (Date.now() - createdAt > sessionMaxAgeSeconds * 1000) return false;

  return getAdminKeys().some((key) => safeEquals(signature, signSession(timestamp, key)));
}

export { ADMIN_COOKIE, sessionMaxAgeSeconds };
