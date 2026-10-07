"use client";

import { useId, useRef, useState } from "react";
import { Buildings, HouseLine } from "@phosphor-icons/react/ssr";
import { WalkthroughVideo } from "@/components/media/WalkthroughVideo";
import type { WalkthroughJourney } from "@/content/walkthrough-videos";
import { track } from "@/lib/analytics/client";

const options: { journey: WalkthroughJourney; label: string; Icon: typeof HouseLine }[] = [
  { journey: "family", label: "For a family", Icon: HouseLine },
  { journey: "team", label: "For a team", Icon: Buildings },
];

// Two recorded walkthroughs behind one tab switch (WAI-ARIA tabs pattern).
export function WalkthroughTheatre() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const select = (index: number, focus: boolean) => {
    const bounded = (index + options.length) % options.length;
    setActive(bounded);
    track("audience_selected", { audience: options[bounded].journey, surface: "walkthrough" });
    if (focus) tabRefs.current[bounded]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: options.length - 1 };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key], true);
    }
  };

  const current = options[active];

  return (
    <div className="theatre">
      <div role="tablist" aria-label="Choose a walkthrough" className="theatre-tabs" onKeyDown={onKeyDown}>
        {options.map((option, index) => (
          <button
            key={option.journey}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${option.journey}`}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === active ? 0 : -1}
            className="theatre-tab"
            onClick={() => select(index, false)}
          >
            <option.Icon size={20} aria-hidden />
            {option.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${current.journey}`}>
        <WalkthroughVideo key={current.journey} journey={current.journey} />
      </div>
    </div>
  );
}
