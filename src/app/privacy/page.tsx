import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How Knowvia collects, uses, shares, protects, and deletes personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="13 October 2026">
      <p>
        This notice explains how Knowvia handles personal data. It applies to this website, the early-access
        list, the onboarding preview, support messages, and the policy-reading service when it launches.
      </p>

      <h2>1. Who is responsible for your data</h2>
      <p>
        Knowvia is a pre-launch product operated by Rishav Dewan in India. Knowvia is not presently a
        registered company. For the Digital Personal Data Protection Act, 2023, Rishav Dewan acts as the
        Data Fiduciary and decides why and how personal data is processed.
      </p>
      <p>
        Privacy and grievance contact: Rishav Dewan, Grievance Officer. Email{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> or call{" "}
        <a href="tel:+919749452397">+91 97494 52397</a>.
      </p>

      <h2>2. Product status and scope</h2>
      <p>
        Knowvia is not open to the public yet. Today, the website collects early-access registrations and,
        only where enabled and separately accepted, short voice notes. The onboarding screens are previews.
        Entries made in those previews stay in your browser and policy files selected there are not uploaded.
      </p>
      <p>
        Before live accounts, payments, or policy uploads are enabled, we will update this notice and show a
        specific collection notice at the relevant step. That notice will identify any new data, purpose,
        processor, retention period, and choice that applies.
      </p>

      <h2>3. Personal data we collect</h2>
      <h3>Current website and early-access list</h3>
      <ul>
        <li>Email address and, if you provide it, your first name.</li>
        <li>The types of health policies in your household and events you say are coming up.</li>
        <li>A voice recording, its duration, file type, email address, consent text, and time of consent, but only when voice notes are enabled and you actively consent.</li>
        <li>Campaign information such as UTM parameters, Google click IDs, Meta click IDs, and the form location used to register.</li>
        <li>A shortened hash derived from an IP address for rate limiting. We do not use that hash to identify you.</li>
        <li>Your analytics choice stored in your browser and, after consent, page and lead events processed by Google or Meta.</li>
        <li>Messages and information you send when you contact us.</li>
      </ul>

      <h3>Planned policy-reading service</h3>
      <p>When the service launches, it may process the following data only after an appropriate notice and consent:</p>
      <ul>
        <li>Account details such as name, email address, mobile number, one-time-code records, and account preferences.</li>
        <li>Policy schedules, benefit booklets, endorsements, claim-related documents, and images you choose to upload.</li>
        <li>Information within those documents, which may include names, ages, relationships, policy and member numbers, employer details, premiums, cover limits, medical information, and claim information.</li>
        <li>Structured information extracted from documents, source-page references, confidence indicators, corrections, and your sharing choices.</li>
        <li>Household member details that an adult is authorised to provide.</li>
        <li>Payment, invoice, subscription, reward, and transaction details if paid features or rewards are introduced. A payment provider may process card, bank, or UPI credentials. Knowvia does not plan to store full payment credentials.</li>
        <li>Device, browser, security, access, and activity logs needed to operate and protect the service.</li>
      </ul>

      <h2>4. Where the data comes from</h2>
      <p>
        We collect data from you, from files you choose to provide, and from your browser or device. With your
        clear permission, data may also come from an employer, adviser, insurer, TPA, partner platform, or
        another adult in your household. We will not treat a partner relationship as consent to access your
        medical or policy information.
      </p>

      <h2>5. Why we process personal data</h2>
      <ul>
        <li>To register you for early access and tell you when Knowvia opens.</li>
        <li>To understand which policy types and user needs should be supported first.</li>
        <li>To accept and review a voice note where you separately consent.</li>
        <li>To provide accounts, read uploaded documents, extract policy terms, show sources and uncertainty, and support household sharing when those features launch.</li>
        <li>To process payments, subscriptions, refunds, benefits, or rewards if those features launch.</li>
        <li>To respond to requests, complaints, corrections, and support questions.</li>
        <li>To prevent abuse, secure the service, investigate incidents, keep required records, and comply with law.</li>
        <li>To measure site use and advertising results only after you allow optional analytics.</li>
        <li>To improve reliability using de-identified or aggregated information where practical.</li>
      </ul>
      <p>
        We process personal data with your free, specific, informed, and unambiguous consent where consent is
        required. We may also process data for uses permitted without consent under applicable law. Refusing
        optional data will not block an unrelated service. You may withdraw consent as easily as you gave it,
        although withdrawal does not affect processing already completed lawfully.
      </p>

      <h2>6. Policy documents, health information, and AI tools</h2>
      <p>
        Insurance documents can contain private health and financial information. When uploads launch, Knowvia
        may use document-reading, OCR, and AI service providers to extract and explain policy text. We will
        identify relevant provider categories at collection and bind processors to confidentiality, security,
        purpose, and deletion requirements.
      </p>
      <p>
        We will not use uploaded policy documents or medical information to train a general-purpose AI model
        unless you receive a separate explanation and give separate, explicit consent. Automated output can be
        incomplete or wrong. Important facts must be checked against the original document and confirmed with
        the insurer, employer, TPA, adviser, or hospital.
      </p>

      <h2>7. Family and third-party information</h2>
      <p>
        Only provide another person’s data if you are authorised to do so and have given them this notice where
        required. Each adult controls access to their own record. Sharing cover information does not
        automatically share medical information. Knowvia will ask for specific permission before disclosing
        personal data to a household member, employer, adviser, or partner, except where disclosure is required
        by law.
      </p>

      <h2>8. Children</h2>
      <p>
        Knowvia is not intended for anyone under 18. A person under 18 must not create an account, join the
        early-access list, submit a voice note, or upload a document. An adult may provide limited information
        about a child covered by a family policy only if that adult is the child’s parent or lawful guardian, or
        otherwise has lawful authority. Where required, we will obtain verifiable parental consent before
        processing a child’s personal data. We will not use children’s data for tracking, behavioural
        advertising, or processing likely to harm the child.
      </p>

      <h2>9. Who receives personal data</h2>
      <p>We may disclose only the data needed to:</p>
      <ul>
        <li>Hosting, database, storage, email, support, security, analytics, payment, OCR, and AI providers acting for us.</li>
        <li>An employer, insurer, TPA, adviser, household member, or partner when you ask us to share with that recipient or clearly consent.</li>
        <li>Professional advisers who owe duties of confidentiality.</li>
        <li>Government bodies, regulators, courts, law enforcement, or other persons where disclosure is legally required or necessary to protect legal rights and safety.</li>
        <li>A buyer or successor during a genuine reorganisation or transfer, subject to confidentiality and this notice or an equivalent notice.</li>
      </ul>
      <p>
        We do not sell personal data. Advertising and analytics providers do not load through this site unless
        you allow optional analytics.
      </p>

      <h2>10. International processing</h2>
      <p>
        Some service providers may process data outside India. When that happens, we will use contractual and
        technical safeguards and follow any transfer restriction notified by the Government of India. A future
        upload notice will identify material overseas processing where required.
      </p>

      <h2>11. Retention and deletion</h2>
      <p>
        We keep personal data only for the stated purpose, to provide a requested service, to meet legal or
        security duties, or to resolve disputes. Early-access data is kept until launch communication is
        complete or you withdraw consent. Voice notes are kept only while needed to understand pre-launch user
        needs, unless you ask for earlier deletion. We will publish a more specific retention schedule before
        live policy uploads and payments begin.
      </p>
      <p>
        When data is no longer needed, we delete it or de-identify it. Deletion from active systems may not
        immediately remove limited copies from secure backups or records that must be retained by law. Security
        and processing logs may be retained for the period required under applicable law. Under the final DPDP
        Rules, certain processing records and logs must be kept for at least one year once those provisions
        apply.
      </p>

      <h2>12. Security and data breaches</h2>
      <p>
        We use reasonable technical and organisational safeguards appropriate to the data and service. Planned
        controls include encryption in transit and at rest where appropriate, access limits, authentication,
        monitoring, secure backups, processor contracts, and incident response. No online system is completely
        secure. If a personal data breach occurs, we will investigate it and give affected people and the Data
        Protection Board the notices required by applicable law.
      </p>

      <h2>13. Cookies, local storage, and analytics</h2>
      <p>
        The site uses browser storage to remember whether you allowed analytics and to support preview
        interactions. Optional Google and Meta tools load only after you select “Allow analytics.” These
        providers may then receive online identifiers and activity data under their own notices. You can refuse
        optional analytics without losing access to the public site. You can change your choice by clearing the
        site’s browser storage. A dedicated preference control will be added before broader tracking is used.
      </p>

      <h2>14. Your rights and choices</h2>
      <p>Subject to applicable law, you may ask us to:</p>
      <ul>
        <li>Provide a summary of your personal data and how it has been processed.</li>
        <li>Identify the persons or categories of persons with whom your data has been shared, where required.</li>
        <li>Correct inaccurate or misleading data and complete incomplete data.</li>
        <li>Erase data that is no longer required or for which consent has been withdrawn, unless retention is legally required.</li>
        <li>Withdraw consent or object to optional analytics and marketing.</li>
        <li>Nominate another individual to exercise your rights in the event of death or incapacity, when this right becomes applicable.</li>
        <li>Raise a grievance about our handling of your personal data.</li>
      </ul>
      <p>
        Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> from the address connected to your
        record and describe your request. We may ask for limited information to verify identity and protect your
        data. We aim to resolve grievances promptly and, in any event, within the period required by law. The
        final DPDP Rules set a maximum grievance period of 90 days once that provision applies. If you first use
        our grievance process and remain dissatisfied, you may complain to the Data Protection Board of India
        when the relevant complaint provisions apply.
      </p>

      <h2>15. Your responsibilities</h2>
      <p>
        You must provide accurate information, protect account access, use another person’s data only with
        authority, and not impersonate another person or suppress material information when exercising a legal
        right or making a complaint.
      </p>

      <h2>16. Changes to this notice</h2>
      <p>
        We may update this notice when the product, vendors, or law changes. The date at the top shows the latest
        version. We will give a prominent notice and seek fresh consent where a change creates a new purpose or
        otherwise requires consent.
      </p>

      <h2>17. Contact and grievances</h2>
      <p>
        Contact Rishav Dewan, Grievance Officer, at{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> or{" "}
        <a href="tel:+919749452397">+91 97494 52397</a>. Please use the subject “Privacy request” and include the
        email address connected to your record. Do not send policy documents or medical information by ordinary
        email unless we specifically ask you to use a secure channel.
      </p>
    </LegalPage>
  );
}
