import { LegalPage, OperatorName, PrivacyContact } from "@/components/marketing/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of use",
  description: "The terms for using the Knowvia website, its guides and its example walkthroughs.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      path="/terms"
      lede="These terms cover this website. Using it means you accept them."
      updated="2 October 2026"
    >
      <h2>About this site</h2>
      <p>
        This website is operated by <OperatorName />. Knowvia is an early-stage project. It is not an insurer,
        insurance broker, corporate agent, web aggregator or adviser, and it does not sell insurance or decide claims.
      </p>

      <h2>Information, not advice</h2>
      <p>
        Guides explain general rules and how policy documents usually work. They are not advice about your policy. Your
        policy wording and your insurer&apos;s decisions govern what is covered and paid. Check important points with
        your insurer before acting on them.
      </p>

      <h2>Example walkthroughs</h2>
      <p>
        The family and team walkthroughs use invented people, policies and amounts. Calculations are simplified
        illustrations and do not estimate any real claim.
      </p>

      <h2>Support acknowledgements</h2>
      <p>
        Organisations listed under “With support from” have supported the project. Their names and logos belong to them.
        Listing them does not mean they endorse, insure, underwrite or guarantee anything on this site.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not attempt to disrupt the site, test its security without written permission, submit other people&apos;s
        email addresses, or use automated tools to sign up.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms and will change the date above when we do. Questions: <PrivacyContact />.
      </p>
    </LegalPage>
  );
}
