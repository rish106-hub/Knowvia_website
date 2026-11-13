import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping and exchange policy",
  description:
    "Knowvia is a digital service with no physical shipping. How and when access is delivered, and how plan changes work.",
};

const phone = { href: "tel:+919749452397", label: "+91 97494 52397" };

export default function ShippingExchangePage() {
  const email = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

  return (
    <LegalPage title="Shipping and exchange policy" updated="13 November 2026">
      <p>
        Knowvia is an online service that reads health-insurance documents and explains what they cover. We do
        not sell, ship, or deliver any physical product. This page explains how you receive access after you pay,
        how long it takes, what to do if something goes wrong, and how you can change your plan.
      </p>
      <p>
        This policy forms part of our <Link href="/terms">terms and conditions</Link> and should be read together
        with our <Link href="/cancellation-and-refund">cancellation and refund policy</Link>. All payments are
        final and non-refundable, as explained there.
      </p>

      <h2>1. No physical shipping</h2>
      <ul>
        <li>Nothing is posted, couriered, or delivered to a physical address.</li>
        <li>There are no shipping, handling, packaging, or delivery charges.</li>
        <li>We do not use delivery partners or couriers, and there is no tracking number.</li>
        <li>We do not ask for a delivery address. Any address requested at checkout is used only for billing and tax purposes.</li>
      </ul>

      <h2>2. What you receive</h2>
      <p>Depending on the plan you buy, your purchase gives you online access to some or all of:</p>
      <ul>
        <li>Your Knowvia account on our website and app.</li>
        <li>Readings of the health-insurance documents you upload, with the pages that support each answer.</li>
        <li>Summaries, comparisons, reminders, and questions to ask your insurer, employer, TPA, or hospital.</li>
        <li>Household features, such as adding family members and their policies.</li>
        <li>Reports you can view on screen and, where offered, download as a file.</li>
      </ul>
      <p>
        The exact features of each plan are shown on the checkout page before you pay.
      </p>

      <h2>3. How access is delivered</h2>

      <h3>3.1 Recurring plans</h3>
      <ul>
        <li>Your plan is activated on your Knowvia account as soon as your payment is confirmed. This is usually instant.</li>
        <li>You use it by signing in at {site.url.replace(/^https?:\/\//, "")} or in the Knowvia app with the email or phone number linked to your account.</li>
        <li>Access continues for the full billing period and renews automatically unless you cancel.</li>
      </ul>

      <h3>3.2 One-time purchases</h3>
      <ul>
        <li>Work on your purchase, such as reading your policy, starts as soon as your payment is confirmed and your documents are uploaded.</li>
        <li>Most readings are ready within a few minutes. Longer or unclear documents can take up to 24 hours.</li>
        <li>We notify you by email, SMS, or in the app when your result is ready.</li>
        <li>Your result stays available in your account for as long as your account is open.</li>
      </ul>

      <h3>3.3 Confirmation and receipt</h3>
      <p>
        After every successful payment, we email a confirmation and a GST receipt to the email linked to your
        account. It shows the plan, amount paid, taxes, payment reference, and, for recurring plans, your next
        renewal date. Your receipts are also available in your account settings.
      </p>

      <h2>4. Delivery timelines</h2>
      <ul>
        <li><strong>Plan activation:</strong> usually instant, and always within 24 hours of a successful payment.</li>
        <li><strong>Policy readings:</strong> usually a few minutes, and within 24 hours for long or hard-to-read documents.</li>
        <li><strong>Confirmation email:</strong> usually within a few minutes of payment.</li>
      </ul>
      <p>
        Timelines start once payment is confirmed by our payment provider. Bank delays, payment processing
        holds, or documents that are missing or unreadable can extend them.
      </p>

      <h2>5. If your access is not delivered</h2>
      <p>If your plan is not active, or your result is not ready, within 24 hours of a successful payment:</p>
      <ul>
        <li>Check your spam or promotions folder for the confirmation email.</li>
        <li>Sign out and sign in again with the same email or phone number you used to pay.</li>
        <li>Check that your payment shows as successful in your bank or payment app.</li>
        <li>If it still does not work, write to {email} with your payment date, amount, and payment reference.</li>
      </ul>
      <p>
        We will confirm receipt within 2 business days and activate your access as soon as we find the problem.
        If money was deducted but the payment never completed, this is a payment error and is handled under
        section 6 of our <Link href="/cancellation-and-refund">cancellation and refund policy</Link>.
      </p>

      <h2>6. Where we deliver</h2>
      <p>
        Knowvia is designed for health-insurance policies issued in India. Our service is available to users in
        India, and prices are charged in Indian rupees (INR). You can sign in from anywhere with an internet
        connection, but we do not guarantee that the service works in every country or on every network.
      </p>

      <h2>7. What you need to access Knowvia</h2>
      <ul>
        <li>An internet connection.</li>
        <li>A current version of Chrome, Safari, Edge, or Firefox, or the Knowvia app on a supported phone.</li>
        <li>Access to the email address or phone number linked to your account, to receive sign-in codes.</li>
        <li>Clear copies of the policy documents you want read, as PDF files or photos.</li>
      </ul>
      <p>
        We are not responsible for delays caused by your device, internet connection, email provider, or mobile
        network.
      </p>

      <h2>8. No exchanges or returns</h2>
      <p>
        Because Knowvia is a digital service that starts as soon as you pay, there is nothing to return, and
        purchases cannot be exchanged for cash, credit, or a different product. Instead, you can change your plan
        as described below.
      </p>

      <h2>9. Changing your plan</h2>

      <h3>9.1 Upgrading</h3>
      <ul>
        <li>You can move to a higher plan at any time from your account settings.</li>
        <li>The upgrade starts immediately.</li>
        <li>We charge only the price difference for the rest of your current billing period. The amount is shown before you confirm.</li>
        <li>Your next renewal is charged at the new plan’s price.</li>
      </ul>

      <h3>9.2 Downgrading</h3>
      <ul>
        <li>You can move to a lower plan at any time from your account settings.</li>
        <li>The downgrade starts at the beginning of your next billing period. You keep your current plan until then.</li>
        <li>No money is returned for the difference between the two plans.</li>
        <li>If the lower plan has smaller limits, such as fewer family members or documents, you may need to remove some before it starts.</li>
      </ul>

      <h3>9.3 Bought the wrong plan</h3>
      <p>
        If you bought a plan that does not suit you, write to {email} within 7 days of payment. We can help you
        upgrade to the right plan by paying only the difference. Payments are not refunded, so please check the
        plan details carefully before you pay.
      </p>

      <h3>9.4 Transfers</h3>
      <p>
        A plan belongs to the account that paid for it. It cannot be transferred, sold, or given to another
        person or account, except by adding family members within a household plan where the plan allows it.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy. The date at the top of this page shows when it last changed. Changes apply
        only to payments made after the update.
      </p>

      <h2>11. Contact</h2>
      <p>
        For help with access, delivery, or plan changes, write to {email} or call{" "}
        <a href={phone.href}>{phone.label}</a>, Monday to Friday, 10 am to 6 pm IST, except public holidays. More
        ways to reach us, including our grievance officer, are on our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
