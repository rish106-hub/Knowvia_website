import { processingStatus } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => processingStatus(request);
