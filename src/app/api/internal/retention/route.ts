import { timingSafeEqual } from "node:crypto";
import { readLeadConfig } from "@/lib/leads/config";
import { json } from "@/lib/leads/http";
import { getLeadServiceDeps } from "@/lib/leads/runtime";

// Daily retention job. Call from cron, Cloud Scheduler or an Azure timer:
//   curl -X POST -H "Authorization: Bearer $RETENTION_JOB_TOKEN" https://<site>/api/internal/retention
// Returns counts only. Disabled unless RETENTION_JOB_TOKEN is set (at least 32 characters).

function authorised(header: string | null): boolean {
  const expected = process.env.RETENTION_JOB_TOKEN;
  if (!expected || expected.length < 32 || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorised(request.headers.get("authorization"))) return json(404, { error: "not_found" });
  const deps = getLeadServiceDeps();
  const config = readLeadConfig();
  if (!deps || !config.enabled) return json(503, { error: "temporarily_unavailable" });
  try {
    const counts = await deps.store.purgeExpired(new Date(), config.config.launchCampaignEndedAt);
    return json(200, { status: "ok", ...counts });
  } catch {
    return json(503, { error: "temporarily_unavailable" });
  }
}
