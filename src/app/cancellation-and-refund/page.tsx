import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cancellation and refund policy",
  description:
    "How to cancel a Knowvia plan, what happens when you cancel, and why all Knowvia payments are final and non-refundable.",
};

const phone = { href: "tel:+919749452397", label: "+91 97494 52397" };

export default function CancellationRefundPage() {
  const email = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

  return (
    <LegalPage title="Cancellation and refund policy" updated="13 November 2026">
      <p>
        This policy explains how you can cancel a paid Knowvia plan, what happens after you cancel, and how we
        handle payments. <strong>All payments made to Knowvia are final. We do not offer refunds</strong>, in
        full or in part, for any plan, purchase, renewal, or unused period, except for the payment errors
        described in section 6.
      </p>
      <p>
        Please read this policy before you pay. By completing a payment, you confirm that you have read and
        accepted it. This policy forms part of our <Link href="/terms">terms and conditions</Link>. If anything
        in this policy conflicts with the terms, this policy applies to cancellations and refunds.
      </p>

      <h2>1. Who this policy applies to</h2>
      <p>
        This policy applies to anyone who pays for Knowvia directly, through our website or app, using any
        payment method we accept, including UPI, debit card, credit card, net banking, and wallets. It covers
        every type of paid access we offer now or in the future, including:
      </p>
      <ul>
        <li>Monthly, quarterly, yearly, or other recurring plans.</li>
        <li>One-time purchases, such as a single policy reading or a one-off report.</li>
        <li>Upgrades, add-ons, and extra household members or documents.</li>
        <li>Renewals, including automatic renewals.</li>
      </ul>
      <p>
        Joining the early-access list is free. We never charge a payment method just because you joined the
        list, filled in a research form, or tried the onboarding preview.
      </p>

      <h2>2. Key terms</h2>
      <ul>
        <li><strong>Plan</strong> means any paid access to Knowvia, whether recurring or one-time.</li>
        <li><strong>Billing period</strong> means the length of time one payment for a recurring plan covers, such as one month or one year.</li>
        <li><strong>Renewal</strong> means the automatic start of a new billing period, with a new payment, at the end of the current one.</li>
        <li><strong>Cancellation</strong> means stopping a recurring plan from renewing.</li>
        <li><strong>Refund</strong> means returning money for a payment that was correctly made for a plan.</li>
        <li><strong>Payment error</strong> means money taken from you by mistake, as described in section 6. Returning it is a correction, not a refund.</li>
      </ul>

      <h2>3. Before you pay</h2>
      <p>Before any charge, the checkout page will clearly show you:</p>
      <ul>
        <li>The plan name and what it includes.</li>
        <li>The price, including GST and any other taxes.</li>
        <li>The billing period and whether the plan renews automatically.</li>
        <li>The date of the next renewal, if there is one.</li>
        <li>How to cancel.</li>
        <li>That the payment is non-refundable.</li>
      </ul>
      <p>
        If anything on the checkout page is unclear, do not pay. Write to us at {email} first and we will answer
        your question.
      </p>

      <h2>4. Cancelling a plan</h2>

      <h3>4.1 How to cancel</h3>
      <p>You can cancel a recurring plan at any time, in any of these ways:</p>
      <ul>
        <li>In your account settings, using the cancel option on your plan.</li>
        <li>By emailing {email} from the email address linked to your account, with the subject line “Cancel my plan”.</li>
        <li>By calling <a href={phone.href}>{phone.label}</a> during support hours. We may ask you to confirm by email so we can verify the request comes from you.</li>
      </ul>
      <p>
        You do not need to give a reason. We will not make cancelling harder than signing up.
      </p>

      <h3>4.2 Cancel before your renewal date</h3>
      <p>
        To avoid being charged for the next billing period, cancel at least 24 hours before your renewal date.
        Your renewal date is shown in your account settings and on your payment receipt. If you cancel less than
        24 hours before renewal, the renewal may already be processing and may still go through. That payment is
        non-refundable, but your plan will not renew again after it.
      </p>

      <h3>4.3 Autopay and payment mandates</h3>
      <p>
        If you set up autopay through UPI, a card, or net banking, cancelling your Knowvia plan stops us from
        requesting future payments. You can also cancel the mandate directly in your UPI app, card settings, or
        bank. Cancelling the mandate alone does not cancel your Knowvia plan, but no further renewals can be
        charged without it. We recommend cancelling in Knowvia as well so your account shows the right status.
      </p>

      <h3>4.4 Confirmation</h3>
      <p>
        When you cancel, we send a confirmation to the email linked to your account. It shows the date you
        cancelled and the date your access ends. Keep this email. If you do not receive it within 24 hours, write
        to us, because your cancellation may not have gone through.
      </p>

      <h3>4.5 What happens after you cancel</h3>
      <ul>
        <li>Your plan will not renew and you will not be charged again.</li>
        <li>You keep full access until the end of the billing period you already paid for.</li>
        <li>When that period ends, your account moves to free access, if available, or paid features stop.</li>
        <li>Your documents and data stay in your account. Cancelling does not delete them.</li>
        <li>You can start a new plan at any time by paying again.</li>
      </ul>

      <h3>4.6 One-time purchases</h3>
      <p>
        One-time purchases do not renew, so there is nothing to cancel. Once you pay, the purchase is final. We
        start work on it, such as reading your policy, as soon as payment is confirmed.
      </p>

      <h3>4.7 Deleting your account</h3>
      <p>
        Cancelling a plan and deleting your account are separate. You can ask us to delete your account and
        documents at any time, as explained in our <Link href="/privacy">privacy notice</Link>. If you delete
        your account during a paid billing period, your access ends immediately and the unused part of the
        period is not refunded.
      </p>

      <h2>5. No refunds</h2>
      <p>
        Knowvia is a digital service. Access starts as soon as your payment is confirmed, and our work on your
        documents begins right away. For this reason, <strong>all payments are final and non-refundable</strong>.
      </p>
      <p>Without limiting that rule, we do not give refunds in any of these cases:</p>
      <ul>
        <li>You change your mind after paying.</li>
        <li>You are not satisfied with the service or a result.</li>
        <li>You did not use the service, or used only part of it, during a billing period.</li>
        <li>You cancel partway through a billing period. You keep access until it ends instead.</li>
        <li>You forgot to cancel before a renewal.</li>
        <li>You bought the wrong plan. You can upgrade, as set out in our <Link href="/shipping-and-exchange">shipping and exchange policy</Link>.</li>
        <li>You downgrade to a cheaper plan.</li>
        <li>Your insurer, employer, TPA, or hospital makes a decision you disagree with.</li>
        <li>A policy document you uploaded was unclear, incomplete, out of date, or not the right document.</li>
        <li>You lose access because you broke our <Link href="/terms">terms</Link>, for example through misuse or fraud.</li>
        <li>You delete your account during a paid billing period.</li>
        <li>Your access was paid for by an employer or partner. Any money matters are between you and that organisation.</li>
        <li>Prices change after you paid. We will never charge you more for a period you already paid for.</li>
      </ul>

      <h2>6. Payment errors</h2>
      <p>
        A payment error is not a refund. If money is taken from you by mistake, we will return it. This covers:
      </p>
      <ul>
        <li><strong>Duplicate charges:</strong> you were charged more than once for the same plan and billing period.</li>
        <li><strong>Wrong amount:</strong> you were charged more than the price shown at checkout.</li>
        <li><strong>Charge after cancellation:</strong> you were charged for a renewal even though you cancelled at least 24 hours before the renewal date, and you have the cancellation confirmation.</li>
        <li><strong>Failed payment that was still debited:</strong> money left your account but the payment did not complete, and your plan was not activated.</li>
      </ul>

      <h3>6.1 Failed payments</h3>
      <p>
        If a payment fails but money is deducted, your bank or payment provider usually reverses it
        automatically within 5 to 7 business days. You do not need to do anything. If it has not been reversed
        after 7 business days, write to us with the details below and we will follow up with our payment
        provider.
      </p>

      <h3>6.2 How to report a payment error</h3>
      <p>
        Write to {email} within 30 days of the charge, from the email linked to your account. Include:
      </p>
      <ul>
        <li>Your name and the email or phone number on your Knowvia account.</li>
        <li>The date and amount of the charge.</li>
        <li>The payment reference, UPI transaction ID, or last four digits of the card.</li>
        <li>A screenshot of the charge from your bank or payment app, if you have it.</li>
        <li>For a charge after cancellation, your cancellation confirmation email.</li>
      </ul>

      <h3>6.3 What happens next</h3>
      <ul>
        <li>We confirm we received your request within 2 business days.</li>
        <li>We check it with our payment provider and tell you the outcome within 7 business days.</li>
        <li>If we confirm a payment error, we return the amount taken by mistake to your original payment method. We start this within 2 business days of confirming.</li>
        <li>Your bank or payment provider usually credits it within 5 to 7 business days. Some banks take longer. We cannot speed this up.</li>
        <li>We do not return money in cash, by cheque, or to a different account or card.</li>
      </ul>

      <h2>7. Chargebacks and disputes</h2>
      <p>
        If you think a charge is wrong, please write to us first. Most problems are fixed faster that way. If you
        raise a chargeback or dispute with your bank without contacting us, we may pause your account while it is
        reviewed. If the chargeback is for a valid payment, we will share proof of the payment and your
        acceptance of this policy with the bank. Raising a chargeback does not affect any legal rights you have.
      </p>

      <h2>8. Free trials and offers</h2>
      <p>
        If we offer a free trial, we will tell you before it starts whether it turns into a paid plan, the date
        your first payment will be taken, and the price. You can cancel at any time during the trial and you will
        not be charged. Once the first payment is taken, it is non-refundable. Discounts, coupons, and promotional
        prices cannot be exchanged for cash and do not create a right to a refund.
      </p>

      <h2>9. Price changes</h2>
      <p>
        We may change our prices. We will tell you by email at least 14 days before a new price applies to your
        renewal. If you do not want to pay the new price, cancel before your renewal date. A price change never
        affects a billing period you have already paid for.
      </p>

      <h2>10. If we suspend or stop the service</h2>
      <p>
        If we plan to stop offering a paid plan or close Knowvia, we will tell you by email at least 30 days in
        advance and stop all future renewals. You keep access until the end of the billing period you already
        paid for, where we can provide it, and you will be able to download your documents and data before the
        service ends. Short outages for maintenance or technical problems are not a reason for a refund.
      </p>

      <h2>11. Taxes</h2>
      <p>
        Prices include GST where it applies. Your receipt shows the tax charged. Where a payment error is
        returned under section 6, the tax on that amount is returned with it.
      </p>

      <h2>12. Your legal rights</h2>
      <p>
        Nothing in this policy removes or limits any right you have under the Consumer Protection Act, 2019, the
        Consumer Protection (E-Commerce) Rules, 2020, or any other law in India that cannot be excluded by
        agreement.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this policy. The date at the top of this page shows when it last changed. Changes apply
        only to payments made after the update. If we make a change that affects your current plan, we will tell
        you by email before it applies.
      </p>

      <h2>14. Contact and grievances</h2>
      <p>
        For questions about cancellation, payments, or this policy, write to {email} or call{" "}
        <a href={phone.href}>{phone.label}</a>, Monday to Friday, 10 am to 6 pm IST, except public holidays. For
        complaints, our grievance officer details are on our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
