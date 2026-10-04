import "server-only";
import { Resend } from "resend";

// ------------------------------------------------------------
// Client
// ------------------------------------------------------------

const apiKey = process.env.RESEND_API_KEY;
const toEmail = process.env.CONTACT_TO_EMAIL;
const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

if (!apiKey) {
  // Warn, but don't crash the whole app at import time.
  // The contact endpoint will return a friendly error instead.
  console.warn("[email] RESEND_API_KEY is not set. Contact form will fail.");
}

const resend = apiKey ? new Resend(apiKey) : null;

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  /** Optional — the page the visitor was on */
  source?: string;
};

export type ContactResult = { ok: true } | { ok: false; error: string };

// ------------------------------------------------------------
// Validation — never trust client input
// ------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload: ContactPayload): string | null {
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const message = payload.message?.trim() ?? "";

  if (name.length < 2) return "Name is too short.";
  if (name.length > 80) return "Name is too long.";
  if (!EMAIL_RE.test(email)) return "Email address looks invalid.";
  if (email.length > 200) return "Email address is too long.";
  if (message.length < 10) return "Message is too short.";
  if (message.length > 4000) return "Message is too long.";

  return null;
}

// ------------------------------------------------------------
// HTML builder — keep it plain and readable in any client
// ------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(payload: ContactPayload): string {
  const name = escapeHtml(payload.name);
  const email = escapeHtml(payload.email);
  const message = escapeHtml(payload.message).replace(/\n/g, "<br/>");
  const source = payload.source
    ? escapeHtml(payload.source)
    : "the chat assistant";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 8px; font-size: 18px;">New message from ${name}</h2>
      <p style="margin: 0 0 24px; color: #666; font-size: 13px;">
        Via ${source}
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 90px;">Name</td>
          <td style="padding: 8px 0;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #c9a961;">${email}</a></td>
        </tr>
      </table>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />

      <p style="margin: 0 0 8px; color: #666; font-size: 12px;">Message</p>
      <div style="font-size: 14px; line-height: 1.6;">
        ${message}
      </div>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />

      <p style="margin: 0; color: #999; font-size: 12px;">
        Reply directly to this email to respond to ${name}.
      </p>
    </div>
  `.trim();
}

function buildText(payload: ContactPayload): string {
  return [
    `New message from ${payload.name}`,
    "",
    `Email: ${payload.email}`,
    `Source: ${payload.source ?? "the chat assistant"}`,
    "",
    "---",
    "",
    payload.message,
    "",
    "---",
    `Reply directly to this email to respond.`,
  ].join("\n");
}

// ------------------------------------------------------------
// Send
// ------------------------------------------------------------

export async function sendContactEmail(
  payload: ContactPayload,
): Promise<ContactResult> {
  if (!resend || !toEmail) {
    return {
      ok: false,
      error: "Contact form is not configured yet. Please try again later.",
    };
  }

  const validationError = validate(payload);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: payload.email.trim(),
      subject: `Portfolio contact from ${payload.name.trim()}`,
      html: buildHtml(payload),
      text: buildText(payload),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: "Could not send. Please try again." };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return { ok: false, error: "Could not send. Please try again." };
  }
}
