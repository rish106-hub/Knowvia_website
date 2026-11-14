import { intakeQuestions } from "@/lib/beta/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => intakeQuestions(request);
