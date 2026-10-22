import { routeMethods } from "@/server/app/runtime";

// DRAFT consent notices, needs legal review.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = routeMethods({ GET: "consents.notices" });
