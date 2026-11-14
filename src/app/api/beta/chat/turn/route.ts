import { chatTurn } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => chatTurn(request);
