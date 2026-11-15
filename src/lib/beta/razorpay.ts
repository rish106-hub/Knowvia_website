// Razorpay Standard Checkout in the browser. Loads checkout.js once, opens the payment window for a server-made order, and resolves with the
// three ids Checkout returns. The server verifies the signature; this file never decides that a payment succeeded.
import type { PaymentOrder } from "./adapter";

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
type Proof = { orderId: string; paymentId: string; signature: string };
type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<RazorpayCtor> | null = null;
function load(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("The payment window could not load.")));
    s.onerror = () => { loading = null; reject(new Error("The payment window could not load. Check your connection and try again.")); };
    document.body.appendChild(s);
  });
  return loading;
}

export class PaymentCancelled extends Error {}

export async function payWithRazorpay(order: PaymentOrder, opts: { name?: string; email?: string } = {}): Promise<Proof> {
  const Razorpay = await load();
  return new Promise<Proof>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.orderId,
      name: "Knowvia",
      description: "Add another policy",
      prefill: { name: opts.name, email: opts.email },
      handler: (r: RazorpayResponse) => resolve({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
      modal: { ondismiss: () => reject(new PaymentCancelled("Payment cancelled.")) },
      theme: { color: "#111111" },
    });
    rzp.on("payment.failed", r => reject(new Error(r.error?.description || "The payment did not go through. You were not charged twice; try again.")));
    rzp.open();
  });
}
