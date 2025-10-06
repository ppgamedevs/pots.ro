import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string; }) {
  if (resend) {
    await resend.emails.send({ from: 'FloristMarket <no-reply@floristmarket.ro>', to, subject, html, text });
    return { ok: true };
  }
  // TODO: fallback SMTP if configured
  console.warn('No email provider configured. Skipping sendEmail for', to, subject);
  return { ok: false };
}


