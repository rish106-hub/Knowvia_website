"use client";

import type { WidgetProps } from "../parts";
import { ModelBacked } from "./ModelBacked";

/** W05: model-backed. Shows "Ask to see this" with the state "Not found yet" until an answer exists. */
export function W05({ state }: WidgetProps<"w05">) {
  return <ModelBacked state={state} id="w05" title="Exclusions" />;
}
