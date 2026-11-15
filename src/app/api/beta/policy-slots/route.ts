import { policySlots } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => policySlots(request);
