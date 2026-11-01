"use client";

import type { WidgetProps } from "../parts";
import { ModelBacked } from "./ModelBacked";

/** W11: model-backed. Shows "Ask to see this" with the state "Not found yet" until an answer exists. */
export function W11({ state }: WidgetProps<"w11">) {
  return <ModelBacked state={state} id="w11" title="Cover across your policies" />;
}
