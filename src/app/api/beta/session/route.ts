import { startSession, sessionState, endSession } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => startSession(request);
export const GET = (request: Request) => sessionState(request);
export const DELETE = (request: Request) => endSession(request);
