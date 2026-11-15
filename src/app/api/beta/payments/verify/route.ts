import { verifyPayment } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => verifyPayment(request);
