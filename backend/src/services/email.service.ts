import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
});

async function sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
  if (!env.EMAIL_HOST || !env.EMAIL_USER) {
    console.warn('[Email] SMTP not configured, skipping:', options.subject, '→', options.to);
    return;
  }
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, ...options });
    console.log('[Email] Sent:', options.subject, '→', options.to);
  } catch (err) {
    console.error('[Email] Failed:', err);
  }
}

function base(body: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#007A66;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:26px;">GuraAha</h1>
    <p style="color:rgba(255,255,255,.75);margin:4px 0 0;font-size:13px;">Rwanda's trusted land &amp; property platform</p>
  </div>
  <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">${body}</div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">© ${new Date().getFullYear()} GuraAha · <a href="mailto:info@guraaha.com" style="color:#007A66;">info@guraaha.com</a> · 0788747764</p>
</div>`;
}

export async function sendBlockerApplicationReceived(to: string, name: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - Application received',
    html: base(`<h2 style="color:#1a1a1a;margin:0 0 12px;">Hi ${name}, we received your application!</h2>
      <p style="color:#4b5563;line-height:1.6;">Thank you for applying to become a GuraAha Blocker. Our team will review your application and contact you soon - by phone or email - to proceed with verification.</p>
      <p style="color:#4b5563;line-height:1.6;">Once approved, log in, subscribe, and start posting listings.</p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">Questions? Call <strong>0788747764</strong></p>`),
  });
}

export async function sendBlockerApproved(to: string, name: string, verificationCode: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - You are approved as a Blocker!',
    html: base(`<h2 style="color:#007A66;margin:0 0 12px;">Congratulations, ${name}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Your GuraAha Blocker application has been <strong>approved</strong>. Log in to your dashboard, subscribe, and start posting property listings.</p>
      <div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:13px;color:#2e7d32;">Your Blocker verification code</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:bold;color:#1b5e20;letter-spacing:4px;">${verificationCode}</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Log in at <a href="https://guraaha.rw" style="color:#007A66;">guraaha.rw</a> to get started.</p>`),
  });
}

export async function sendBlockerRejected(to: string, name: string, reason: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - Application update',
    html: base(`<h2 style="color:#1a1a1a;margin:0 0 12px;">Hi ${name},</h2>
      <p style="color:#4b5563;line-height:1.6;">After reviewing your Blocker application, we are unable to approve it at this time.</p>
      ${reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#991b1b;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
      <p style="color:#4b5563;line-height:1.6;">Questions? Email <strong>info@guraaha.com</strong> or call <strong>0788747764</strong>.</p>`),
  });
}

export async function sendBlockerNeedsRevision(to: string, name: string, note: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - Action required on your application',
    html: base(`<h2 style="color:#1a1a1a;margin:0 0 12px;">Hi ${name}, your application needs an update</h2>
      <p style="color:#4b5563;line-height:1.6;">Our team requires the following update before we can proceed:</p>
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#92400e;">${note}</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Contact us at <strong>info@guraaha.com</strong> or <strong>0788747764</strong> with the update.</p>`),
  });
}

export async function sendListingApproved(to: string, blockerName: string, listingTitle: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - Your listing is live!',
    html: base(`<h2 style="color:#007A66;margin:0 0 12px;">Great news, ${blockerName}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Your listing <strong>"${listingTitle}"</strong> has been <strong>approved</strong> and is now live on GuraAha.</p>
      <p style="color:#4b5563;line-height:1.6;">Buyers can now discover it and unlock contact details</p>`),
  });
}

export async function sendListingRejected(to: string, blockerName: string, listingTitle: string, reason: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - Listing update',
    html: base(`<h2 style="color:#1a1a1a;margin:0 0 12px;">Hi ${blockerName},</h2>
      <p style="color:#4b5563;line-height:1.6;">Your listing <strong>"${listingTitle}"</strong> was not approved.</p>
      ${reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#991b1b;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
      <p style="color:#4b5563;line-height:1.6;">You may edit and resubmit from your dashboard. Contact <strong>info@guraaha.com</strong> for help.</p>`),
  });
}

export async function sendListingNeedsRevision(to: string, blockerName: string, listingTitle: string, note: string): Promise<void> {
  await sendEmail({
    to, subject: 'GuraAha - Listing revision required',
    html: base(`<h2 style="color:#1a1a1a;margin:0 0 12px;">Hi ${blockerName},</h2>
      <p style="color:#4b5563;line-height:1.6;">Your listing <strong>"${listingTitle}"</strong> needs the following revision:</p>
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#92400e;">${note}</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Update your listing from the dashboard and resubmit. Contact <strong>info@guraaha.com</strong> if you need help.</p>`),
  });
}
