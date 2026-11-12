// Single source for the beta app origin. NEXT_PUBLIC_ vars are inlined at build time.
export const DEFAULT_BETA_URL = "https://knowviafrontend.vercel.app/";

export function betaBaseUrl() {
  const base = process.env.NEXT_PUBLIC_BETA_URL || DEFAULT_BETA_URL;
  return base.endsWith("/") ? base : base + "/";
}

export function betaDemoUrl() {
  return betaBaseUrl() + "signin?demo=1";
}

// Entry into the app's add-cover journey. Returns null unless NEXT_PUBLIC_BETA_URL is an
// absolute https URL (http only for localhost), so callers can keep their existing target.
export function appAddCoverUrl() {
  const raw = (process.env.NEXT_PUBLIC_BETA_URL || "").trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
  if (url.username || url.password) return null;
  return url.origin + url.pathname.replace(/\/+$/, "") + "/covers/add";
}
