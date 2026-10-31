// The /app/connect/[connectorId] page is a hard 404 for stub connectors unless this is a demo build. Pages cannot import
// src/server/app (tests/unit/app-bff/no-client-import.test.ts), so this mirrors the demoData rule of src/server/app/env.ts:
// the flag is set AND NODE_ENV is explicitly development or test. A unit test keeps the two in step.
export function isDemoBuild(env: Record<string, string | undefined>): boolean {
  const flag = ["1", "true", "yes", "on"].includes((env.APP_DEMO_DATA ?? "").trim().toLowerCase());
  return flag && ["development", "test"].includes(env.NODE_ENV ?? "");
}
