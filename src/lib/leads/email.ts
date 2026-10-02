import "server-only";
import { Resend } from "resend";

// Double opt-in email adapter. The default provider is Resend; tests and local development
// inject their own sender. Message content never includes anything the person typed except their address.

export interface ConfirmationMessage {
  to: string;
  confirmUrl: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  idempotencyKey: string;
}

export type ConfirmationSender = (message: ConfirmationMessage) => Promise<boolean>;

export function renderConfirmationEmail(message: Pick<ConfirmationMessage, "confirmUrl" | "unsubscribeUrl">) {
  const subject = "Confirm your Knowvia early access";
  const text = [
    "You asked for Knowvia early-access updates.",
    "",
    `Confirm your email: ${message.confirmUrl}`,
    "",
    "The link works for 72 hours. If you did not ask for this, ignore this email and nothing more will be sent.",
    "",
    `Stop all emails: ${message.unsubscribeUrl}`,
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;color:#1A3034;line-height:1.5">
<p>You asked for Knowvia early-access updates.</p>
<p><a href="${escapeHtml(message.confirmUrl)}" style="display:inline-block;padding:12px 20px;background:#176F69;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">Confirm your email</a></p>
<p>The link works for 72 hours. If you did not ask for this, ignore this email and nothing more will be sent.</p>
<p style="font-size:14px;color:#5C7074"><a href="${escapeHtml(message.unsubscribeUrl)}" style="color:#5C7074">Stop all emails</a></p>
</body></html>`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function createResendSender(apiKey: string, from: string): ConfirmationSender {
  const resend = new Resend(apiKey);
  return async (message) => {
    const { subject, text, html } = renderConfirmationEmail(message);
    try {
      const { error } = await resend.emails.send(
        {
          from,
          to: [message.to],
          subject,
          text,
          html,
          headers: {
            "List-Unsubscribe": `<${message.oneClickUnsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        },
        { idempotencyKey: message.idempotencyKey },
      );
      return !error;
    } catch {
      return false;
    }
  };
}

/** Local development only: prints the confirmation link instead of sending mail. */
export function createDevelopmentSender(): ConfirmationSender {
  return async (message) => {
    console.info(`[dev email] Confirmation link: ${message.confirmUrl}`);
    return true;
  };
}
