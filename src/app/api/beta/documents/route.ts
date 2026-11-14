import { uploadDocument } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => uploadDocument(request);
