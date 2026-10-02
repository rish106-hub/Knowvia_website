import { json } from "@/lib/leads/http";

// Load-balancer health check. Reports process liveness only; it never touches the database.
export function GET(): Response {
  return json(200, { status: "ok" });
}
