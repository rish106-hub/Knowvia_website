import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms that apply to the Knowvia website and planned health-policy reading service.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions" updated="13 October 2026">
      <p>
        These terms govern your use of the Knowvia website, early-access list, onboarding preview, and the
        policy-reading service when it launches. By using a feature or submitting information, you agree to the
        terms that apply to that feature. If you do not agree, do not use the service.
      </p>

      <h2>1. Who operates Knowvia</h2>
      <p>
        Knowvia is a pre-launch product operated by Rishav Dewan in India. Knowvia is not presently a registered
        company. In these terms, “Knowvia,” “we,” “us,” and “our” refer to Rishav Dewan operating the Knowvia
        product. You can contact us at <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> or{" "}
        <a href="tel:+919749452397">+91 97494 52397</a>.
      </p>

      <h2>2. Product status</h2>
      <p>
        Knowvia is not open to the public yet. The current site mainly provides information, an early-access
        list, optional pre-launch research, and a non-functional onboarding preview. Preview screens, sample
        results, pricing references, upload controls, rewards, and partner flows do not promise that a feature
        is available or will launch in its current form.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old and legally able to enter a contract to use Knowvia. People under 18
        must not register, submit information, or use an account. An adult may manage information about a child
        covered under a policy only where the adult is the parent, lawful guardian, or otherwise legally
        authorised.
      </p>

      <h2>4. Accounts and access</h2>
      <p>
        When accounts launch, you must provide accurate information, keep your email, phone, one-time codes, and
        devices secure, and tell us promptly about suspected unauthorised access. You are responsible for
        activity performed through your account unless caused by our failure to use reasonable security. We may
        require verification before changing account details or releasing personal data.
      </p>

      <h2>5. What Knowvia does</h2>
      <p>
        Knowvia is intended to read health-insurance documents, organise policy information, show the pages that
        support an answer, identify missing or conflicting information, and help users form questions for an
        insurer, employer, TPA, adviser, or hospital. Features may include household views, document comparison,
        reminders, paid plans, partner access, and rewards.
      </p>

      <h2>6. What Knowvia does not do</h2>
      <ul>
        <li>Knowvia is not an insurer, insurance broker, corporate agent, insurance intermediary, TPA, hospital, doctor, lawyer, financial adviser, or emergency service.</li>
        <li>Knowvia does not sell or underwrite insurance unless a future service is separately introduced with the approvals and disclosures required by law.</li>
        <li>Knowvia does not approve, reject, settle, or guarantee a claim.</li>
        <li>Knowvia does not guarantee coverage, eligibility, cashless treatment, reimbursement, medical necessity, network status, price, or a particular outcome.</li>
        <li>Knowvia’s information is not medical, legal, financial, or insurance advice.</li>
      </ul>
      <p>
        Get treatment first in an emergency. Contact local emergency services, the hospital, insurer, or TPA.
        Do not delay care while waiting for Knowvia or rely on Knowvia as an emergency channel.
      </p>

      <h2>7. Documents and automated output</h2>
      <p>
        Policy wording, schedules, endorsements, benefit booklets, insurer records, and applicable law control
        your rights. Knowvia may use OCR, rules, and AI systems. They can misread a page, miss an endorsement,
        use incomplete information, or produce an incorrect explanation. An output marked as sourced is still a
        reading aid, not a binding decision.
      </p>
      <p>
        You must review the original document and confirm important information directly with the relevant
        insurer, employer, TPA, adviser, or hospital. Tell us when an output appears wrong. We may correct,
        withdraw, or add warnings to an output.
      </p>

      <h2>8. Your documents and authority</h2>
      <p>You keep ownership of documents and information you submit. By submitting them, you confirm that:</p>
      <ul>
        <li>You own them or have lawful authority to use and provide them.</li>
        <li>You have given any notice and obtained any permission required from other people named in them.</li>
        <li>The submission does not violate confidentiality, privacy, intellectual-property, employment, or contractual duties.</li>
        <li>The information is not knowingly false, deceptive, harmful, or unlawful.</li>
      </ul>
      <p>
        You give Knowvia a limited, non-exclusive right to host, copy, read, structure, and display submitted
        material only as needed to provide, secure, support, and improve the service in line with the{" "}
        <Link href="/privacy">Privacy Notice</Link> and your choices. This permission ends when the material is
        deleted, except for limited backups, legal records, and de-identified information lawfully retained.
      </p>

      <h2>9. Household, employer, and partner access</h2>
      <p>
        A household, employer, insurer, adviser, or partner relationship does not by itself give another person
        access to your policy or medical data. Sharing controls may allow you to choose particular recipients
        and data fields. Check the recipient and scope before sharing. A recipient may keep information after
        receiving it, and their own privacy duties may apply.
      </p>
      <p>
        If an employer or partner gives you access, it may pay for the service or receive limited programme
        information. It will not receive your policy or medical data through Knowvia unless you direct or
        consent to that disclosure, or law requires it. Separate partner terms may apply to the partner.
      </p>

      <h2>10. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>Access or try to access another person’s account, documents, or results without authority.</li>
        <li>Upload malware, scrape the service, bypass access controls, probe security, overload systems, or interfere with operation.</li>
        <li>Use Knowvia to commit fraud, make a false claim, impersonate someone, discriminate unlawfully, or violate another person’s rights.</li>
        <li>Reverse engineer or copy protected parts of the service except where applicable law does not permit that restriction.</li>
        <li>Resell, sublicense, or commercially exploit consumer access without our written permission.</li>
        <li>Use automated output as the sole basis for a medical, employment, insurance, credit, or other high-impact decision about another person.</li>
      </ul>
      <p>We may investigate misuse and restrict or suspend access where reasonably needed to protect users, the service, or legal rights.</p>

      <h2>11. Pricing, subscriptions, and refunds</h2>
      <p>
        Knowvia may introduce paid consumer plans, one-time purchases, employer-funded access, or partner-funded
        access. Before a charge, we will show the price, taxes, billing period, renewal terms, included features,
        cancellation method, and applicable refund terms. We will not charge a payment method merely because
        you joined the early-access list.
      </p>
      <p>
        Future checkout-specific terms shown before payment will form part of these terms. Mandatory rights
        under the Consumer Protection Act, 2019 and other applicable law are not excluded. Refunds will follow
        the checkout terms and applicable law. If a partner pays, cancellation of that arrangement may end
        partner-funded access without ending your rights over your data.
      </p>

      <h2>12. Rewards and promotions</h2>
      <p>
        Knowvia may offer referral rewards, research incentives, discounts, credits, or other promotions. Each
        offer may have separate rules covering eligibility, duration, verification, limits, taxes, expiry, and
        disqualification for abuse. A reward has no cash value unless its specific rules say otherwise. We may
        withhold or reverse rewards obtained through fraud, duplicate accounts, manipulation, or a breach of
        the offer rules.
      </p>

      <h2>13. Intellectual property</h2>
      <p>
        Knowvia and its licensors own the service, brand, software, interface, explanatory content, and other
        material we create. Subject to these terms, we give you a limited, personal, revocable, non-transferable
        licence to use the service for lawful household purposes. This does not transfer ownership.
      </p>
      <p>
        If you send feedback, you allow us to use it without payment or attribution. This does not give us a
        right to use your policy documents, medical information, identity, or private support messages as public
        testimonials.
      </p>

      <h2>14. Third-party services</h2>
      <p>
        Knowvia may link to or work with insurers, TPAs, hospitals, payment providers, analytics providers, and
        partner platforms. We do not control their services, decisions, security, availability, or terms. A link
        or integration is not an endorsement or guarantee. Review the third party’s terms and privacy notice.
      </p>

      <h2>15. Privacy</h2>
      <p>
        Our <Link href="/privacy">Privacy Notice</Link> explains how we collect, use, share, retain, and protect
        personal data and how you may exercise your rights. Feature-specific consent or privacy notices may also
        apply. If a feature-specific notice conflicts with the general notice about that feature’s data, the
        more specific notice controls.
      </p>

      <h2>16. Service changes, availability, and suspension</h2>
      <p>
        We may add, remove, or change features and may pause the service for maintenance, security, legal, or
        operational reasons. We do not promise uninterrupted or error-free availability. Where practical, we
        will give notice before a material change that removes a paid feature during an active paid period and
        provide any remedy required by law or the checkout terms.
      </p>
      <p>
        We may suspend or terminate access for a material breach, unlawful conduct, security risk, non-payment,
        or where the service is discontinued. We will use a proportionate response and provide notice where
        reasonably possible. You may stop using the service and request account deletion at any time.
      </p>

      <h2>17. Disclaimers</h2>
      <p>
        To the extent permitted by law, Knowvia is provided on an “as available” basis. We do not promise that
        every document can be read, every term will be found, every source is current, or every output is
        accurate. We do not disclaim responsibilities that cannot lawfully be excluded, including obligations
        concerning personal data, paid services, fraud, or consumer rights.
      </p>

      <h2>18. Limitation of liability</h2>
      <p>
        To the extent permitted by law, Knowvia will not be liable for indirect, incidental, special, exemplary,
        or consequential loss, or for loss caused by relying on an unverified automated output, a third-party
        decision, unauthorised use of your account that was not caused by us, or events outside our reasonable
        control.
      </p>
      <p>
        For a claim connected with a paid service, our total liability will not exceed the amount you paid to
        Knowvia for that service during the 12 months before the event giving rise to the claim. For a free
        service, total liability will not exceed INR 1,000. These limits do not apply where prohibited by law or
        to liability that cannot lawfully be limited, including fraud, wilful misconduct, gross negligence,
        breach of confidentiality, or violation of statutory consumer or data-protection rights.
      </p>

      <h2>19. Your responsibility for misuse</h2>
      <p>
        To the extent permitted by law, you are responsible for direct losses and reasonable costs caused by
        your unlawful use, knowing violation of another person’s rights, or material breach of your promises
        about authority to submit documents. This does not make you responsible for loss caused by Knowvia’s own
        acts or failures.
      </p>

      <h2>20. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of India. Before filing a claim, contact us and allow 30 days for a
        good-faith attempt to resolve it. This does not stop either party from seeking urgent relief or using a
        regulator, consumer commission, Data Protection Board, or other forum available under law. Courts and
        statutory forums that have lawful jurisdiction in India may hear disputes. We do not restrict any
        mandatory forum or remedy available to a consumer.
      </p>

      <h2>21. Changes to these terms</h2>
      <p>
        We may update these terms as the service and law change. The date at the top identifies the latest
        version. We will provide reasonable notice of material changes. If a change needs fresh acceptance, we
        will ask for it before the affected feature continues. Changes do not remove rights or obligations that
        already arose unless the law permits it.
      </p>

      <h2>22. General terms</h2>
      <p>
        If part of these terms is unenforceable, the remaining parts continue to apply. A delay in enforcing a
        term is not a waiver. You may not transfer your account or these terms without our consent. We may
        transfer the service and these terms as part of a genuine reorganisation or business transfer, subject
        to applicable law and continued protection of your rights.
      </p>

      <h2>23. Contact and grievances</h2>
      <p>
        Contact Rishav Dewan at <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> or{" "}
        <a href="tel:+919749452397">+91 97494 52397</a>. For privacy complaints, use the subject “Privacy
        grievance.” For other complaints, use “Knowvia grievance” and describe the feature, date, and issue. Do
        not email policy documents or medical information unless we ask you to use a secure channel.
      </p>
    </LegalPage>
  );
}
