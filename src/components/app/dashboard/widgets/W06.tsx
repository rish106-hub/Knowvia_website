"use client";

import type { WidgetProps } from "../parts";
import { ModelBacked } from "./ModelBacked";

/** W06: model-backed. Shows "Ask to see this" with the state "Not found yet" until an answer exists. */
export function W06({ state }: WidgetProps<"w06">) {
  return <ModelBacked state={state} id="w06" title="Key dates" />;
}
