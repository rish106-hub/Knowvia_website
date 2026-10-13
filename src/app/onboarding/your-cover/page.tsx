import type { Metadata } from "next";
import { OnboardingCoverDesktop } from "@/components/onboarding/OnboardingCoverDesktop";
import { OnboardingCoverMobile } from "@/components/onboarding/OnboardingCoverMobile";

export const metadata: Metadata = { title: "Your family’s cover | Onboarding preview", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <>
      <div className="kv-only-mobile"><OnboardingCoverMobile /></div>
      <div className="kv-only-desktop"><OnboardingCoverDesktop /></div>
    </>
  );
}
