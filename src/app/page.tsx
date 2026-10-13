import { ClosingSection } from "@/components/home/ClosingSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { IndustrySection } from "@/components/home/IndustrySection";
import { StoriesSection } from "@/components/home/StoriesSection";
import { TrustAndPartnerSections } from "@/components/home/TrustAndPartnerSections";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function HomePage() {
  return <><a className="skip-link" href="#main">Skip to main content</a><SiteHeader /><main id="main"><HeroSection /><IndustrySection /><HowItWorksSection /><StoriesSection /><TrustAndPartnerSections /><ClosingSection /></main><SiteFooter /></>;
}
