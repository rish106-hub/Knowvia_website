import { routeMethods } from "@/server/app/runtime";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routeMethods({ POST: "consents.revoke" });
