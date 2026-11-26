import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface SmtpCandidate {
  host: string;
  port: number;
  secure: boolean;
}

export class EmailService {
  private candidates: SmtpCandidate[] = [];

  constructor() {
    this.initCandidates();
  }

  private initCandidates() {
    if (!env.EMAIL_HOST_USER || !env.EMAIL_HOST_PASSWORD) {
      console.warn(
        '[EmailService] EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not set. Outbound emails will be logged to console.'
      );
      return;
    }

    const primaryHost = (env.EMAIL_HOST || 'guraaha.com').trim();
    const primaryPort = Number(env.EMAIL_PORT) || 465;
    const mailSubdomain = primaryHost.startsWith('mail.')
      ? primaryHost
      : `mail.${primaryHost.replace(/^https?:\/\//, '')}`;

    const rawList: SmtpCandidate[] = [
      { host: primaryHost, port: primaryPort, secure: primaryPort === 465 },
      { host: mailSubdomain, port: 465, secure: true },
      { host: mailSubdomain, port: 587, secure: false },
      { host: primaryHost, port: primaryPort === 465 ? 587 : 465, secure: primaryPort !== 465 },
      { host: '127.0.0.1', port: 465, secure: true },
      { host: '127.0.0.1', port: 587, secure: false },
    ];

    const seen = new Set<string>();
    for (const c of rawList) {
      const key = `${c.host}:${c.port}`;
      if (!seen.has(key)) {
        seen.add(key);
        this.candidates.push(c);
      }
    }
  }

  private getFromAddress(): string {
    const authUser = (env.EMAIL_HOST_USER || '').trim();
    const configuredFrom = (env.DEFAULT_FROM_EMAIL || '').trim();

    // Namecheap cPanel Exim requires the From address to match the authenticated mailbox when authUser is an email
    if (authUser.includes('@')) {
      if (!configuredFrom || configuredFrom.includes('@guraaha.rw') || !configuredFrom.includes(authUser)) {
        return `"Guraaha" <${authUser}>`;
      }
    }
    return configuredFrom || `"Guraaha" <noreply@guraaha.com>`;
  }

  private async dispatchMail(options: {
    to: string;
    subject: string;
    text?: string;
    html: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    const from = this.getFromAddress();

    if (this.candidates.length === 0) {
      console.log(`[MOCK EMAIL DISPATCH] From: ${from} | To: ${options.to} | Subject: ${options.subject}`);
      return { success: true, messageId: 'mock-console-id' };
    }

    let lastError: unknown = null;
    for (const candidate of this.candidates) {
      try {
        const transporter = nodemailer.createTransport({
          host: candidate.host,
          port: candidate.port,
          secure: candidate.secure,
          auth: {
            user: env.EMAIL_HOST_USER,
            pass: env.EMAIL_HOST_PASSWORD,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          tls: {
            rejectUnauthorized: false,
          },
        });

        const info = await transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        console.log(
          `[EmailService] Email sent to ${options.to} via ${candidate.host}:${candidate.port} (${info.messageId})`
        );
        return { success: true, messageId: info.messageId };
      } catch (err) {
        lastError = err;
        console.warn(
          `[EmailService] SMTP attempt via ${candidate.host}:${candidate.port} failed:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    console.error('[EmailService] All SMTP candidates failed for recipient:', options.to, lastError);
    return { success: false };
  }

  async sendVerificationEmail(
    to: string,
    verificationCode: string,
    recipientName = 'Valued User'
  ): Promise<{ success: boolean; messageId?: string }> {
    const subject = `Your Guraaha Verification Code: ${verificationCode}`;
    const text = `Hello ${recipientName},\n\nYour Guraaha verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes. If you did not request this, please disregard this email.\n\nBest regards,\nThe Guraaha Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; color: #111827;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0F2C26; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Guraaha</h2>
          <p style="color: #6B7280; font-size: 13px; margin-top: 4px;">Rwanda Verified Property Marketplace</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          Hello <strong>${recipientName}</strong>,
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin-bottom: 20px;">
          Thank you for signing up on Guraaha. Please use the verification code below to verify your account:
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
          &copy; ${new Date().getFullYear()} Guraaha Rwanda. All rights reserved.
        </p>
      </div>
    `;

    return this.dispatchMail({ to, subject, text, html });
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    recipientName = 'Valued User'
  ): Promise<{ success: boolean; messageId?: string }> {
    const subject = 'Guraaha – Reset Your Password';
    const text = `Hello ${recipientName},\n\nUse the link below to reset your Guraaha password (valid for 1 hour):\n${resetLink}`;
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;">Guraaha – Password Reset</h2>
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Click the button below to reset your Guraaha password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetLink}" style="background:#007A66;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Reset Password</a>
      </div>
      <p style="font-size:12px;color:#9CA3AF;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} Guraaha Rwanda</p>
    </div>`;

    return this.dispatchMail({ to, subject, text, html });
  }

  async sendBlockerApplicationEmail(to: string, name: string): Promise<void> {
    const subject = 'Guraaha – Blocker Application Received';
    const text = `Hello ${name},\n\nThank you for applying to become a Guraaha Blocker! Our compliance team will review your National ID and district registration and notify you once approved.`;
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;">Guraaha – Blocker Application Received</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for applying to become a Guraaha Blocker! Our compliance team will review your National ID and district registration.</p>
      <p>You will be notified once your application has been reviewed.</p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} Guraaha Rwanda</p>
    </div>`;

    await this.dispatchMail({ to, subject, text, html });
  }

  async sendBlockerApprovalEmail(
    to: string,
    name: string,
    verificationCode: string,
    username?: string,
    tempPassword?: string
  ): Promise<void> {
    const subject = '🎉 Guraaha – Your Blocker Application is Approved!';
    const text = `Hello ${name},\n\nCongratulations! Your Blocker application has been approved.\nVerification Code: ${verificationCode}${
      username ? `\nUsername: ${username}` : ''
    }${tempPassword ? `\nTemporary Password: ${tempPassword}` : ''}\n\nYou can now log in at ${
      env.FRONTEND_URL || 'https://guraaha.com'
    }/login`;
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;">🎉 Guraaha – You are now a Blocker!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Congratulations! Your Blocker application has been <strong>approved</strong>.</p>
      <div style="background:#F3F4F6;border:1px solid #D1D5DB;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">Your Verification Code</p>
        <span style="font-size:28px;font-weight:800;letter-spacing:4px;color:#0F2C26;font-family:monospace;">${verificationCode}</span>
        ${username ? `<p style="margin:10px 0 0;font-size:13px;color:#0F2C26;">Username: <strong>${username}</strong></p>` : ''}
        ${tempPassword ? `<p style="margin:4px 0 0;font-size:13px;color:#0F2C26;">Temporary Password: <strong>${tempPassword}</strong></p>` : ''}
      </div>
      <p>You can now log in to your dashboard, subscribe to a Blocker Pro plan, and start posting property listings.</p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} Guraaha Rwanda</p>
    </div>`;

    await this.dispatchMail({ to, subject, text, html });
  }

  async sendAlertEmail(
    to: string,
    subject: string,
    title: string,
    summary: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const html = `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="color:#0F2C26;margin-top:0;">${title}</h2>
      <p style="font-size:14px;line-height:1.6;color:#374151;">${summary}</p>
      <div style="margin:24px 0;">
        <a href="${env.FRONTEND_URL || 'https://guraaha.com'}" style="background:#007A66;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">View on Guraaha</a>
      </div>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:20px 0;"/>
      <p style="font-size:11px;color:#9CA3AF;text-align:center;">&copy; ${new Date().getFullYear()} Guraaha Rwanda</p>
    </div>`;

    return this.dispatchMail({
      to,
      subject,
      text: `${title}\n\n${summary}`,
      html,
    });
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
