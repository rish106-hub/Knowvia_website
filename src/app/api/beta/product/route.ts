import { productCandidates, confirmProduct } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => productCandidates(request);
export const POST = (request: Request) => confirmProduct(request);
