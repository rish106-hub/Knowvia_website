// The four demo dashboards. Pages cannot import src/server/app (tests/unit/app-bff/no-client-import.test.ts), so this mirrors
// DEMO_SCENARIOS of src/server/app/demo-data.ts; tests/unit/app-dashboard/demo-data.test.ts keeps the two in step.
export const DEMO_SCENARIO_IDS = ["empty", "partial", "full", "conflicting"] as const;
export type DemoScenarioId = (typeof DEMO_SCENARIO_IDS)[number];

export const isDemoScenarioId = (value: unknown): value is DemoScenarioId => typeof value === "string" && (DEMO_SCENARIO_IDS as readonly string[]).includes(value);

export const DEMO_SCENARIO_LABELS: Record<DemoScenarioId, string> = {
  empty: "Nothing added yet",
  partial: "One document read",
  full: "Everything read",
  conflicting: "Documents disagree",
};

export const demoHref = (scenario: DemoScenarioId) => `/app/demo/${scenario}`;
