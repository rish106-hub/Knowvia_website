import { holdingFacts } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => holdingFacts(request);
