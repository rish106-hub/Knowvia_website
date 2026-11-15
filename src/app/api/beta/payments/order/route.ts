import { createPaymentOrder } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => createPaymentOrder(request);
