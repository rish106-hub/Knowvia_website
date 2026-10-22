import { routeMethods } from "@/server/app/runtime";

// PROVISIONAL (D1/D2). POST signs in through the dev identity provider only; DELETE signs out.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routeMethods({ GET: "session.get", POST: "session.create", DELETE: "session.delete" });
