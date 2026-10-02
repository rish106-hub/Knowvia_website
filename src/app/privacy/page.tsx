import Link from "next/link";
import { LegalPage, OperatorName, PrivacyContact } from "@/components/marketing/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy notice",
  description: "What Knowvia's website collects, why, who processes it, how long it is kept and how to exercise your rights.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      path="/privacy"
      lede="This notice covers the Knowvia website and early-access list. It does not cover the Knowvia product, which will have its own notice."
      updated="2 October 2026"
    >
      <h2>Who is responsible</h2>
      <p>
        Knowvia is an early-stage project operated by <OperatorName />. For any privacy question or request, write to{" "}
        <PrivacyContact />.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Early-access sign-up.</strong> Your email address, whether you are asking for your family or a team,
          what you would like to receive, and, only if you add them, your name, role and organisation. We use these to
          confirm your sign-up and send what you asked for. The legal basis is your consent.
        </li>
        <li>
          <strong>Consent record.</strong> The version of this notice you agreed to, when you agreed and confirmed, and the
          page where you signed up, so we can show what you consented to.
        </li>
        <li>
          <strong>Security.</strong> A Cloudflare Turnstile check when you open the sign-up form, and short-lived counters
          keyed to a scrambled (hashed) form of your network address, to block automated abuse.
        </li>
        <li>
          <strong>Analytics, only if you allow it.</strong> A fixed list of actions, such as opening a guide, with the page
          path. No recordings, no form content, no email addresses.
        </li>
        <li>
          <strong>Advertising measurement, only if you allow it.</strong> Google Ads learns whether an ad led to a
          sign-up.
        </li>
      </ul>
      <p>
        We do not ask for, and you should not send us, policy documents, health information or identity numbers through
        this website.
      </p>

      <h2>How we protect it</h2>
      <p>
        Your email address is stored encrypted. A separate keyed fingerprint lets us avoid duplicates without reading the
        address. Sign-up data is kept apart from any product data. Access is limited to the people who run the
        early-access list.
      </p>

      <h2>Who processes it for us</h2>
      <ul>
        <li>Our cloud hosting and managed database providers, which store the sign-up list.</li>
        <li>Resend, which sends the confirmation and update emails.</li>
        <li>Cloudflare, which runs the Turnstile bot check.</li>
        <li>PostHog (analytics) and Google (advertising), only if you allow them.</li>
      </ul>
      <p>Some of these providers may process data outside India. We will list each provider&apos;s region before launch.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Unconfirmed sign-ups are deleted after 7 days.</li>
        <li>Confirmed guide subscribers are kept until they unsubscribe.</li>
        <li>Sign-ups for launch updates or help understanding your cover are erased 90 days after the launch campaign ends.</li>
        <li>
          When you unsubscribe, your email, name, role and organisation are erased at once. We keep only the scrambled
          fingerprint so that we never email you again by mistake.
        </li>
        <li>Abuse-prevention counters are deleted within a day.</li>
      </ul>

      <h2>Your choices and rights</h2>
      <p>
        You can withdraw consent at any time with the link in every email, and change cookie choices from{" "}
        <Link href="/cookies">the cookie notice</Link>. Under India&apos;s Digital Personal Data Protection Act, 2023 you can
        ask for a summary of your data, correction, completion or erasure, raise a grievance, and nominate someone to act
        for you. Write to <PrivacyContact />. If you are not satisfied with our response, you may approach the Data
        Protection Board of India.
      </p>

      <h2>Age</h2>
      <p>The early-access list is for people aged 18 or older.</p>
    </LegalPage>
  );
}
