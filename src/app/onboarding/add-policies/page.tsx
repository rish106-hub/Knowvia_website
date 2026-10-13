import type { Metadata } from "next";
import { OnboardingAddPolicies } from "@/components/onboarding/OnboardingAddPolicies";

export const metadata: Metadata = { title: "Add the policies you have | Onboarding preview", robots: { index: false, follow: false } };

export default function Page() {
  return <OnboardingAddPolicies />;
}
