"use client";

import Link from "next/link";
import { track } from "@/lib/analytics/client";

export function HeroActions() {
  return (
    <div className="button-row">
        <Link href="#walkthrough" className="button" onClick={() => track("hero_cta_clicked", { cta: "see_how_it_works" })}>
          See Knowvia work
        </Link>
        <Link
          href="#early-access"
          className="button button-quiet"
          onClick={() => track("hero_cta_clicked", { cta: "join_early_access" })}
        >
          Join early access
        </Link>
    </div>
  );
}
