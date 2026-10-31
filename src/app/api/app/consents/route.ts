import { routeMethods } from "@/server/app/runtime";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routeMethods({ GET: "consents.list", POST: "consents.grant" });
