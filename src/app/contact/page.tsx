import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "How to reach Knowvia by email or phone, support hours, response times, and our grievance officer.",
};

const phone = { href: "tel:+919749452397", label: "+91 97494 52397" };

export default function ContactPage() {
  const email = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

  return (
    <LegalPage title="Contact us" updated="13 November 2026">
      <p>
        Have a question about Knowvia, your account, a payment, your documents, or your data? We are here to
        help. Use the details below to reach us.
      </p>

      <h2>1. Support</h2>

      <h3>Email</h3>
      <p>
        {email}
        <br />
        The fastest way to reach us. Write from the email linked to your Knowvia account so we can find it.
      </p>

      <h3>Phone</h3>
      <p>
        <a href={phone.href}>{phone.label}</a>
        <br />
        Calls and WhatsApp messages.
      </p>

      <h3>Support hours</h3>
      <p>
        Monday to Friday, 10 am to 6 pm IST, except public holidays in India. Emails sent outside these hours are
        answered on the next business day.
      </p>

      <h3>Response times</h3>
      <ul>
        <li>We reply to emails within 2 business days.</li>
        <li>Payment and access problems are prioritised.</li>
        <li>Complaints are acknowledged within 48 hours and resolved within one month, as set out in section 3.</li>
      </ul>

      <h2>2. Business details</h2>
      <ul>
        <li><strong>Business name:</strong> Knowvia</li>
        <li><strong>Operated by:</strong> Rishav Dewan, as a sole proprietor</li>
        <li><strong>Country:</strong> India</li>
        <li><strong>Email:</strong> {email}</li>
        <li><strong>Phone:</strong> <a href={phone.href}>{phone.label}</a></li>
      </ul>

      <h2>3. Grievance officer</h2>
      <p>
        If you have a complaint about Knowvia, including about a payment, your data, or content on our website,
        you can contact our grievance officer. This role is set up under the Information Technology Act, 2000,
        the rules made under it, and the Consumer Protection (E-Commerce) Rules, 2020.
      </p>
      <ul>
        <li><strong>Name:</strong> Rishav Dewan</li>
        <li><strong>Email:</strong> {email}, with the subject line “Grievance”</li>
        <li><strong>Phone:</strong> <a href={phone.href}>{phone.label}</a></li>
        <li><strong>Hours:</strong> Monday to Friday, 10 am to 6 pm IST</li>
      </ul>
      <p>
        We acknowledge every complaint within 48 hours and aim to resolve it within one month of receiving it.
        We will tell you the outcome by email.
      </p>

      <h2>4. What to include when you write</h2>
      <p>To help us answer quickly, please include:</p>
      <ul>
        <li>Your name and the email or phone number on your Knowvia account.</li>
        <li>A short description of the problem or question.</li>
        <li>Screenshots, if they help explain the problem.</li>
        <li>For payment questions: the payment date, amount, and payment reference or UPI transaction ID.</li>
      </ul>
      <p>
        Do not send passwords, one-time codes, full card numbers, or bank PINs. We will never ask for them.
      </p>

      <h2>5. Find the right help</h2>
      <ul>
        <li><strong>Cancelling a plan or a payment problem:</strong> see our <Link href="/cancellation-and-refund">cancellation and refund policy</Link>. All payments are final and non-refundable.</li>
        <li><strong>Access not working after payment, or changing plans:</strong> see our <Link href="/shipping-and-exchange">shipping and exchange policy</Link>.</li>
        <li><strong>Your data, or deleting your account:</strong> see our <Link href="/privacy">privacy notice</Link>.</li>
        <li><strong>Rules for using Knowvia:</strong> see our <Link href="/terms">terms and conditions</Link>.</li>
        <li><strong>Businesses, insurers, and partners:</strong> see <Link href="/for-partners">Knowvia for partners</Link> or write to {email}.</li>
      </ul>

      <h2>6. In an emergency</h2>
      <p>
        Knowvia is not an emergency or claims service. In a medical emergency, get treatment first. Call 112 or
        contact your hospital, insurer, or TPA directly. Do not wait for a reply from Knowvia.
      </p>
    </LegalPage>
  );
}
