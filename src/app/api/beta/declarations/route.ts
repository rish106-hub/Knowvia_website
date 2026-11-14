import { listDeclarations, saveDeclarations } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => listDeclarations(request);
export const POST = (request: Request) => saveDeclarations(request);
