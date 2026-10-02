import { json, readJsonBody } from "@/lib/leads/http";
import { clientAddressFrom, getLeadServiceDeps, isSameOrigin } from "@/lib/leads/runtime";
import { submitLead } from "@/lib/leads/service";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers)) return json(403, { error: "forbidden" });

  const deps = getLeadServiceDeps();
  if (!deps) return json(503, { error: "temporarily_unavailable" });

  const read = await readJsonBody(request);
  if ("response" in read) return read.response;

  const result = await submitLead(
    {
      body: read.body,
      idempotencyKey: request.headers.get("idempotency-key"),
      clientAddress: clientAddressFrom(request.headers),
    },
    deps,
  );
  return json(result.status, result.body, result.status === 429 ? { "Retry-After": "600" } : {});
}
