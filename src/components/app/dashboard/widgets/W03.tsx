"use client";

import type { WidgetProps } from "../parts";
import { ModelBacked } from "./ModelBacked";

/**
 * W03: model-backed. It may show a waiting-period end date only when both facts it needs (the policy start and the waiting
 * period) are confirmed in the documents. Nothing is confirmed by any code path today, so it shows "Ask to see this".
 */
export function W03({ state }: WidgetProps<"w03">) {
  return <ModelBacked state={state} id="w03" title="Waiting period end date" note="An end date is shown only when both the start date and the waiting period are confirmed in your documents. Neither is confirmed yet." />;
}
