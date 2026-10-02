import { json } from "@/lib/leads/http";
import { getLeadServiceDeps } from "@/lib/leads/runtime";
import { unsubscribeLead } from "@/lib/leads/service";

// RFC 8058 one-click unsubscribe (mail clients POST without an Origin) and the /unsubscribe page.
// The signed link authenticates the request.
export async function POST(request: Request): Promise<Response> {
  const deps = getLeadServiceDeps();
  if (!deps) return json(503, { error: "temporarily_unavailable" });
  const url = new URL(request.url);
  const result = await unsubscribeLead(url.searchParams.get("lead"), url.searchParams.get("sig"), deps);
  return json(result.status, result.body);
}
