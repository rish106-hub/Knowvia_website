"use client";

import Link from "next/link";
import { Buildings, HouseLine } from "@phosphor-icons/react/ssr";
import { track } from "@/lib/analytics/client";

export function HeroActions() {
  return (
    <>
      <div className="button-row">
        <Link href="#early-access" className="button" onClick={() => track("hero_cta_clicked", { cta: "join_early_access" })}>
          Join early access
        </Link>
        <Link
          href="/how-it-works"
          className="button button-quiet"
          onClick={() => track("hero_cta_clicked", { cta: "see_how_it_works" })}
        >
          See how it works
        </Link>
      </div>
      <nav className="audience-choice" aria-labelledby="audience-choice-label">
        <p id="audience-choice-label" className="small muted">
          Start with the example closest to you
        </p>
        <div className="audience-options">
          <Link
            href="/for-families"
            className="audience-option"
            onClick={() => track("audience_selected", { audience: "family", surface: "hero" })}
          >
            <HouseLine size={20} aria-hidden />
            For my family
          </Link>
          <Link
            href="/for-employers"
            className="audience-option"
            onClick={() => track("audience_selected", { audience: "team", surface: "hero" })}
          >
            <Buildings size={20} aria-hidden />
            For my team
          </Link>
        </div>
      </nav>
    </>
  );
}
