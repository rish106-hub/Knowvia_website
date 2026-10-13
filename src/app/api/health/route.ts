export function GET() {
  return Response.json({ status: "ok", service: "knowvia-web" }, { headers: { "cache-control": "no-store" } });
}
