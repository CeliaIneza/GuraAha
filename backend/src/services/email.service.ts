import { env } from '../config/env';

export class EmailService {
  private transporter: any = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.EMAIL_HOST && env.EMAIL_HOST_USER && env.EMAIL_HOST_PASSWORD) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodemailer = require('nodemailer');
        const port = Number(env.EMAIL_PORT) || 587;
        const isSecure = port === 465;

        this.transporter = nodemailer.createTransport({
          host: env.EMAIL_HOST,
          port,
          secure: isSecure,
          auth: {
            user: env.EMAIL_HOST_USER,
            pass: env.EMAIL_HOST_PASSWORD,
          },
          tls: {
            rejectUnauthorized: env.NODE_ENV === 'production',
          },
        });
      } catch {
        console.warn('[EmailService] nodemailer module not installed; using console/dev email dispatch.');
      }
    } else {
      console.warn(
        '[EmailService] Email credentials (EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD) not fully set. Outbound emails will be logged to console in dev mode.'
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    verificationCode: string,
    recipientName = 'Valued User'
  ): Promise<{ success: boolean; messageId?: string }> {
    const fromAddress = env.DEFAULT_FROM_EMAIL || 'GuraAha <noreply@guraaha.rw>';
    const subject = `Your GuraAha Verification Code: ${verificationCode}`;

    const text = `Hello ${recipientName},\n\nYour GuraAha verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes. If you did not request this, please disregard this email.\n\nBest regards,\nThe GuraAha Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; color: #111827;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0F2C26; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">GuraAha</h2>
          <p style="color: #6B7280; font-size: 13px; margin-top: 4px;">Rwanda Verified Property Marketplace</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          Hello <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin-bottom: 20px;">
          Thank you for signing up on GuraAha. Please use the verification code below to verify your account and activate your blocker eligibility:
        </p>
        
        <div style="background-color: #F3F4F6; border: 1px solid #D1D5DB; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0F2C26; font-family: monospace;">
            ${verificationCode}
          </span>
        </div>
        
        <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 20px;">
          This code will expire in <strong>15 minutes</strong>. For your security, never share this code with anyone.
        </p>
        
        <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 24px 0;" />
        
        <p style="font-size: 11px; color: #9CA3AF; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} GuraAha Rwanda. All rights reserved.
        </p>
      </div>
    `;

    if (!this.transporter) {
      console.log(`[MOCK EMAIL DISPATCH] To: ${to} | Code: ${verificationCode}`);
      return { success: true, messageId: 'mock-console-id' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EmailService] Failed to send email via SMTP:', error);
      console.log(`[DEV FALLBACK CODE] To: ${to} | Verification Code: ${verificationCode}`);
      return { success: false };
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    recipientName = 'Valued User'
  ): Promise<{ success: boolean; messageId?: string }> {
    const fromAddress = env.DEFAULT_FROM_EMAIL || 'GuraAha <noreply@guraaha.rw>';
    const subject = 'GuraAha – Reset Your Password';
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;">GuraAha – Password Reset</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Click the button below to reset your GuraAha password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetLink}" style="background:#007A66;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Reset Password</a>
      </div>
      <p style="font-size:12px;color:#9CA3AF;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} GuraAha Rwanda</p>
    </div>`;
    if (!this.transporter) {
      console.log(`[MOCK PASSWORD RESET EMAIL] To: ${to} | Link: ${resetLink}`);
      return { success: true, messageId: 'mock-console-id' };
    }
    try {
      const info = await this.transporter.sendMail({ from: fromAddress, to, subject, html });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error);
      console.log(`[DEV FALLBACK RESET LINK] To: ${to} | Link: ${resetLink}`);
      return { success: false };
    }
  }

  async sendBlockerApplicationEmail(to: string, name: string): Promise<void> {
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;">GuraAha – Blocker Application Received</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for applying to become a GuraAha Blocker! Our compliance team will review your National ID and sector registration.</p>
      <p>You will be notified by email once your application has been reviewed (usually within 1-3 business days).</p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} GuraAha Rwanda</p>
    </div>`;
    if (!this.transporter) { console.log(`[MOCK EMAIL] Blocker application received: ${to}`); return; }
    try { await this.transporter.sendMail({ from: env.DEFAULT_FROM_EMAIL || 'GuraAha <noreply@guraaha.rw>', to, subject: 'GuraAha – Blocker Application Received', html }); }
    catch (e) { console.error('[EmailService] sendBlockerApplicationEmail failed:', e); }
  }

  async sendBlockerApprovalEmail(to: string, name: string, verificationCode: string): Promise<void> {
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;">🎉 GuraAha – You are now a Blocker!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Congratulations! Your Blocker application has been <strong>approved</strong>.</p>
      <div style="background:#F3F4F6;border:1px solid #D1D5DB;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">Your Verification Code</p>
        <span style="font-size:28px;font-weight:800;letter-spacing:4px;color:#0F2C26;font-family:monospace;">${verificationCode}</span>
      </div>
      <p>You can now log in to your dashboard and start posting property listings.</p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} GuraAha Rwanda</p>
    </div>`;
    if (!this.transporter) { console.log(`[MOCK EMAIL] Blocker approved: ${to} | Code: ${verificationCode}`); return; }
    try { await this.transporter.sendMail({ from: env.DEFAULT_FROM_EMAIL || 'GuraAha <noreply@guraaha.rw>', to, subject: '🎉 GuraAha – Your Blocker Application is Approved!', html }); }
    catch (e) { console.error('[EmailService] sendBlockerApprovalEmail failed:', e); }
  }

  async sendAlertEmail(
    to: string,
    subject: string,
    title: string,
    summary: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const fromAddress = env.DEFAULT_FROM_EMAIL || 'GuraAha <noreply@guraaha.rw>';
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;margin-top:0;">${title}</h2>
      <p style="font-size:14px;line-height:1.6;color:#374151;">${summary}</p>
      <div style="margin:24px 0;">
        <a href="${env.FRONTEND_URL || 'http://localhost:5173'}" style="background:#007A66;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">View on GuraAha</a>
      </div>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} GuraAha Rwanda</p>
    </div>`;

    if (!this.transporter) {
      console.log(`[MOCK ALERT EMAIL] To: ${to} | Subject: ${subject} | Summary: ${summary}`);
      return { success: true, messageId: 'mock-console-id' };
    }

    try {
      const info = await this.transporter.sendMail({ from: fromAddress, to, subject, text: `${title}\n\n${summary}`, html });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EmailService] sendAlertEmail failed:', error);
      return { success: false };
    }
  }

  async sendBulkAlertEmails(
    recipients: string[],
    subject: string,
    title: string,
    summary: string
  ): Promise<{ total: number; sent: number }> {
    const uniqueEmails = Array.from(new Set(recipients.map((e) => e.trim()).filter(Boolean)));
    let sent = 0;
    for (const email of uniqueEmails) {
      const res = await this.sendAlertEmail(email, subject, title, summary);
      if (res.success) sent++;
    }
    return { total: uniqueEmails.length, sent };
  }
}
