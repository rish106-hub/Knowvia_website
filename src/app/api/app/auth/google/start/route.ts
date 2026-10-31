import { routeMethods } from "@/server/app/runtime";

// V1b. GET starts the Google sign-in (302 to Google, sets the sealed kv_oidc cookie). 501 unless Google sign-in is configured.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routeMethods({ GET: "oidc.google.start" });
