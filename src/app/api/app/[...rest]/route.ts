import { catchAllMethods } from "@/server/app/runtime";

// Any /api/app/* path without a route: APP_DISABLED while the BFF is off, otherwise a JSON 404.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = catchAllMethods();
