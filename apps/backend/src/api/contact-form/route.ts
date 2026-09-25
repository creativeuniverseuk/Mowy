import { timingSafeEqual } from "crypto";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";

/**
 * Emails a contact-form submission to the shop's inbox, through the
 * notification module's "email" channel (the Resend provider,
 * src/modules/resend).
 *
 * Not a public route: it lives outside /store deliberately and only
 * answers the storefront's own server-side route
 * (apps/storefront/src/app/(storefront)/api/contact/route.ts), which is
 * what does the public-facing work — spam honeypot, rate limiting, and
 * storing the submission in Payload. Both sides share CONTACT_FORM_SECRET;
 * without it anyone could use this to send arbitrary email to the shop.
 *
 * The recipient comes only from CONTACT_FORM_RECIPIENT — never from the
 * request — so a caller can't redirect mail anywhere else.
 */
const ContactFormBody = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(1).max(5000),
  submission_id: z.union([z.string(), z.number()]).optional(),
});

function secretMatches(provided: string | undefined, expected: string) {
  if (!provided) {
    return false;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const secret = process.env.CONTACT_FORM_SECRET;
  const recipient = process.env.CONTACT_FORM_RECIPIENT;

  if (!secret || !recipient) {
    logger.error(
      "contact-form route: CONTACT_FORM_SECRET or CONTACT_FORM_RECIPIENT not set — can't send contact-form emails."
    );
    return res.status(503).json({ message: "Contact form email isn't configured." });
  }

  if (!secretMatches(req.get("x-contact-form-secret"), secret)) {
    return res.status(401).json({ message: "Invalid secret" });
  }

  const parsed = ContactFormBody.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid submission" });
  }

  const { name, email, message, submission_id } = parsed.data;

  // Newlines in a subject line are meaningless at best — keep it one line.
  const subjectName = name.replace(/[\r\n]+/g, " ");
  const subject = `New contact form message from ${subjectName}`;

  const text = [
    "New message from the MOWY website contact form.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
    "",
    "Reply to this email to answer them directly.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f6;font-family:Inter,Arial,sans-serif;color:#14141c;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;">
      <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#345fd1;">MOWY · Contact form</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr>
          <td style="padding:6px 12px 6px 0;color:#5b5d6b;vertical-align:top;width:80px;">Name</td>
          <td style="padding:6px 0;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#5b5d6b;vertical-align:top;">Email</td>
          <td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#345fd1;">${escapeHtml(email)}</a></td>
        </tr>
      </table>
      <p style="margin:20px 0 6px;font-size:13px;color:#5b5d6b;">Message</p>
      <div style="white-space:pre-wrap;font-size:15px;line-height:1.6;border-left:3px solid #345fd1;padding:4px 0 4px 12px;">${escapeHtml(message)}</div>
      <p style="margin:24px 0 0;font-size:13px;color:#5b5d6b;">Reply to this email to answer them directly.</p>
    </div>
  </body>
</html>`;

  const notificationModule = req.scope.resolve(Modules.NOTIFICATION);

  try {
    await notificationModule.createNotifications({
      to: recipient,
      channel: "email",
      template: "contact-form-submission",
      content: { subject, html, text },
      provider_data: { reply_to: email },
      resource_type: "contact_submission",
      ...(submission_id !== undefined
        ? { resource_id: String(submission_id) }
        : {}),
    });
  } catch (error) {
    logger.error(
      `contact-form route: email failed to send — ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return res.status(502).json({ message: "Email failed to send" });
  }

  res.json({ sent: true });
}
