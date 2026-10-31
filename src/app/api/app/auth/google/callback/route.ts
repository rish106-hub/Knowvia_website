import { routeMethods } from "@/server/app/runtime";

// V1b. Google sends the browser back here with ?code and ?state. The BFF checks state against the kv_oidc cookie, exchanges the
// code server to server, verifies the ID token and 302s to /app. 501 unless Google sign-in is configured.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routeMethods({ GET: "oidc.google.callback" });
