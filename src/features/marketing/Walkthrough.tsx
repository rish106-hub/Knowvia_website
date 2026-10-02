"use client";

import { useId, useRef, useState } from "react";
import { track } from "@/lib/analytics/client";

export interface WalkthroughStep {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface WalkthroughProps {
  journey: "family" | "team";
  title: string;
  steps: WalkthroughStep[];
}

// Accessible tabs (WAI-ARIA tabs pattern). The keyed panel replays a short CSS entrance on each
// step; the global reduced-motion rule turns it off.
export function Walkthrough({ journey, title, steps }: WalkthroughProps) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const select = (index: number, focus: boolean) => {
    const bounded = (index + steps.length) % steps.length;
    setActive(bounded);
    track("journey_step_viewed", { journey, step: bounded + 1 });
    if (focus) tabRefs.current[bounded]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: steps.length - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key], true);
    }
  };

  const step = steps[active];

  return (
    <div className="walkthrough" data-journey={journey}>
      <div className="walkthrough-head">
        <p className="walkthrough-title">{title}</p>
        <span className="synthetic-badge">Synthetic example</span>
      </div>
      <div role="tablist" aria-label={`${title} steps`} className="walkthrough-tabs" onKeyDown={onKeyDown}>
        {steps.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === active ? 0 : -1}
            className="walkthrough-tab"
            onClick={() => select(index, false)}
          >
            <span className="walkthrough-step-number" aria-hidden="true">
              {index + 1}
            </span>
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${step.id}`}
        className="walkthrough-panel"
        tabIndex={0}
      >
        <div key={step.id} className="walkthrough-step">
          {step.content}
        </div>
      </div>
    </div>
  );
}
