import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
  private transporter: any = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.EMAIL_HOST && env.EMAIL_HOST_USER && env.EMAIL_HOST_PASSWORD) {
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
}
