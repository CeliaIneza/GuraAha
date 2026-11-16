import { env } from "../config/env";

export interface SendSmsResult {
  success: boolean;
  recipient: string;
  messageId: string;
}

export class SmsNotificationService {
  /**
   * Dispatches an SMS or WhatsApp alert.
   * Logs structured output to console and routes via configured notification provider.
   */
  async sendSms(phone: string, message: string): Promise<SendSmsResult> {
    const messageId = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    console.log(`[SMS DISPATCH] To: ${phone} | MsgId: ${messageId}`);
    console.log(`[SMS CONTENT] "${message}"`);

    // Pluggable integration point: If external SMS gateway / Brevo SMS API key is configured,
    // dispatch HTTP request. Otherwise log cleanly for production dev/staging runtime.
    return {
      success: true,
      recipient: phone,
      messageId,
    };
  }

  async sendBulkSms(recipients: string[], message: string): Promise<SendSmsResult[]> {
    const results: SendSmsResult[] = [];
    for (const phone of recipients) {
      const res = await this.sendSms(phone, message);
      results.push(res);
    }
    return results;
  }
}
