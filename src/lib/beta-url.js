// Single source for the beta app origin. NEXT_PUBLIC_ vars are inlined at build time.
export const DEFAULT_BETA_URL = "https://knowviafrontend.vercel.app/";

export function betaBaseUrl() {
  const base = process.env.NEXT_PUBLIC_BETA_URL || DEFAULT_BETA_URL;
  return base.endsWith("/") ? base : base + "/";
}

export function betaDemoUrl() {
  return betaBaseUrl() + "signin?demo=1";
}
