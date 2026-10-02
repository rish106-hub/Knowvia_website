import { CONSENT_COOKIE } from "@/lib/consent/consent";

// Tiny scripts inlined in <head> so stored preferences apply before first paint.
// Kept outside client components: a "use client" export cannot be read as a string on the server.

export const THEME_STORAGE_KEY = "kv-theme";

const themeInit = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

// Marks the document when a consent cookie exists, so CSS hides the banner before paint.
const consentInit = `try{if(document.cookie.indexOf("${CONSENT_COOKIE}=")>-1){document.documentElement.dataset.consent="set"}}catch(e){}`;

export const headInitScript = `(function(){${themeInit}${consentInit}})();`;
