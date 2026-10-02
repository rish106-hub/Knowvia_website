import { json, readJsonBody } from "@/lib/leads/http";
import { getLeadServiceDeps, isSameOrigin } from "@/lib/leads/runtime";
import { confirmLead } from "@/lib/leads/service";

// Confirmation is a POST from the /confirm page, so mail scanners that prefetch links cannot confirm.
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers)) return json(403, { error: "forbidden" });
  const deps = getLeadServiceDeps();
  if (!deps) return json(503, { error: "temporarily_unavailable" });
  const read = await readJsonBody(request);
  if ("response" in read) return read.response;
  const result = await confirmLead(read.body, deps);
  return json(result.status, result.body);
}
