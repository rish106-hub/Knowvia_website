"use client";

import type { WidgetProps } from "../parts";
import { ModelBacked } from "./ModelBacked";

/** W02: model-backed. Shows "Ask to see this" with the state "Not found yet" until an answer exists. */
export function W02({ state }: WidgetProps<"w02">) {
  return <ModelBacked state={state} id="w02" title="Who the policy covers" />;
}
