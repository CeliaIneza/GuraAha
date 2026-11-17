import crypto from 'node:crypto';
import {
  PaymentProvider,
  InitiatePaymentInput,
  InitiateDepositInput,
  InitiatePaymentResult,
  TransactionStatusResult,
  ParsedCallback,
} from '../interface/payment-provider.interface';
import { env } from '../config/env';

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function computePassword(username: string, accountNo: string, partnerPassword: string, timestamp: string): string {
  return crypto.createHash('sha256').update(username + accountNo + partnerPassword + timestamp).digest('hex');
}

function normalizeMobilePhone(phone: string): string {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.startsWith('07') && digits.length === 10) {
    return `25${digits}`;
  }
  return digits;
}

function resolveCallbackUrl(configuredUrl: string): string {
  if (
    (configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1')) &&
    env.INTOUCHPAY_LOCAL_CALLBACK_FALLBACK_URL
  ) {
    console.warn(
      `[IntouchPay] INTOUCHPAY_CALLBACK_URL is set to localhost (${configuredUrl}). ` +
        `Using INTOUCHPAY_LOCAL_CALLBACK_FALLBACK_URL (${env.INTOUCHPAY_LOCAL_CALLBACK_FALLBACK_URL}) to avoid SSRF 2500.`
    );
    return env.INTOUCHPAY_LOCAL_CALLBACK_FALLBACK_URL;
  }
  return configuredUrl;
}

interface RequestPaymentResponse {
  status?: string;
  requesttransactionid: string;
  success: boolean;
  responsecode: string;
  transactionid?: string;
  referenceid?: string;
  message?: string;
  provider?: { code: string; name: string };
}

interface GetTransactionStatusResponse {
  success?: boolean;
  responsecode?: string;
  status?: string;
  message?: string;
  requesttransactionid?: string;
  transactionid?: string;
}

interface CallbackInnerPayload {
  status: string;
  requesttransactionid: string;
  transactionfee?: number;
  referenceno?: string;
  currency?: string;
  amount?: number;
  responsecode?: string;
  transactionid: string;
  statusdesc?: string;
}

interface CallbackPayload {
  jsonpayload?: CallbackInnerPayload | string;
  status?: string;
  requesttransactionid?: string;
  transactionid?: string;
}

export class IntouchPayProvider implements PaymentProvider {
  readonly name = 'INTOUCHPAY';

  private readonly baseUrl = env.INTOUCHPAY_BASE_URL;
  private readonly depositUrl =
    env.INTOUCHPAY_DEPOSIT_URL ??
    this.baseUrl.replace(/requestpayment\/?$/, 'requestdeposit/');
  private readonly statusUrl =
    env.INTOUCHPAY_STATUS_URL ??
    this.baseUrl.replace(/requestpayment\/?$/, 'gettransactionstatus/');
  private readonly username = env.INTOUCHPAY_USERNAME;
  private readonly accountNo = env.INTOUCHPAY_ACCOUNT_NO;
  private readonly partnerPassword = env.INTOUCHPAY_PARTNER_PASSWORD;
  private readonly callbackUrl = env.INTOUCHPAY_CALLBACK_URL;

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!this.username || !this.accountNo || !this.partnerPassword || !this.callbackUrl) {
      throw new Error(
        'IntouchPay is not configured: missing one of INTOUCHPAY_USERNAME / INTOUCHPAY_ACCOUNT_NO / INTOUCHPAY_PARTNER_PASSWORD / INTOUCHPAY_CALLBACK_URL'
      );
    }

    const timestamp = formatTimestamp(new Date());
    const password = computePassword(this.username, this.accountNo, this.partnerPassword, timestamp);
    const mobilephone = normalizeMobilePhone(input.phone);
    const callbackurl = resolveCallbackUrl(this.callbackUrl);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        accountno: this.accountNo,
        timestamp,
        amount: input.amountRwf,
        password,
        mobilephone,
        requesttransactionid: input.internalPaymentId,
        callbackurl,
      }),
    });

    const raw = (await response.json()) as RequestPaymentResponse;

    if (!response.ok || !raw.success) {
      throw new Error(`IntouchPay request failed (${raw.responsecode ?? response.status}): ${raw.message ?? 'Unknown error'}`);
    }

    if (!raw.transactionid) {
      throw new Error('IntouchPay response did not include a transactionid');
    }

    return { providerReference: raw.transactionid, rawResponse: raw };
  }

  async initiateDeposit(input: InitiateDepositInput): Promise<InitiatePaymentResult> {
    if (!this.username || !this.accountNo || !this.partnerPassword) {
      throw new Error(
        'IntouchPay is not configured: missing one of INTOUCHPAY_USERNAME / INTOUCHPAY_ACCOUNT_NO / INTOUCHPAY_PARTNER_PASSWORD'
      );
    }

    const timestamp = formatTimestamp(new Date());
    const password = computePassword(this.username, this.accountNo, this.partnerPassword, timestamp);
    const mobilephone = normalizeMobilePhone(input.phone);

    const response = await fetch(this.depositUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        timestamp,
        amount: input.amountRwf,
        withdrawcharge: input.withdrawCharge ?? 1,
        reason: input.reason ?? 'GURAAHA DEPOSIT',
        password,
        sid: input.sid ?? '1',
        mobilephone,
        requesttransactionid: input.internalPaymentId,
      }),
    });

    const raw = (await response.json()) as RequestPaymentResponse;

    if (!response.ok || !raw.success) {
      throw new Error(`IntouchPay deposit failed (${raw.responsecode ?? response.status}): ${raw.message ?? 'Unknown error'}`);
    }

    const reference = raw.transactionid || raw.referenceid || raw.requesttransactionid;
    return { providerReference: reference, rawResponse: raw };
  }

  async checkTransactionStatus(
    requestTransactionId: string,
    providerReference?: string | null
  ): Promise<TransactionStatusResult> {
    if (!this.username || !this.accountNo || !this.partnerPassword) {
      return { status: 'PENDING', rawResponse: null };
    }

    try {
      const timestamp = formatTimestamp(new Date());
      const password = computePassword(this.username, this.accountNo, this.partnerPassword, timestamp);

      const response = await fetch(this.statusUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          accountno: this.accountNo,
          timestamp,
          password,
          requesttransactionid: requestTransactionId,
          ...(providerReference ? { transactionid: providerReference } : {}),
        }),
      });

      if (!response.ok) {
        return { status: 'PENDING', rawResponse: null };
      }

      const raw = (await response.json()) as GetTransactionStatusResponse;
      const statusLower = String(raw.status || '').toLowerCase();
      const code = String(raw.responsecode || '');

      if (
        code === '01' ||
        statusLower === 'successfull' ||
        statusLower === 'successful' ||
        statusLower === 'completed'
      ) {
        return { status: 'COMPLETED', rawResponse: raw };
      }

      if (
        statusLower === 'failed' ||
        statusLower === 'declined' ||
        statusLower === 'cancelled' ||
        (raw.success === false && code !== '1000')
      ) {
        return { status: 'FAILED', rawResponse: raw };
      }

      return { status: 'PENDING', rawResponse: raw };
    } catch (err) {
      console.warn('IntouchPay gettransactionstatus check failed:', err);
      return { status: 'PENDING', rawResponse: null };
    }
  }

  parseCallback(
    rawBody: unknown,
    _headers: Record<string, string | string[] | undefined>
  ): ParsedCallback {
    let body = rawBody as CallbackPayload;
    if (typeof rawBody === 'string') {
      try {
        body = JSON.parse(rawBody);
      } catch {
        // leave as is
      }
    }

    let inner: CallbackInnerPayload | undefined;
    if (typeof body?.jsonpayload === 'string') {
      try {
        inner = JSON.parse(body.jsonpayload) as CallbackInnerPayload;
      } catch {
        inner = undefined;
      }
    } else if (body?.jsonpayload && typeof body.jsonpayload === 'object') {
      inner = body.jsonpayload as CallbackInnerPayload;
    } else {
      inner = body as unknown as CallbackInnerPayload;
    }

    if (!inner || (typeof inner.requesttransactionid !== 'string' && typeof inner.transactionid !== 'string')) {
      throw new Error('Malformed IntouchPay callback payload');
    }

    const statusStr = String(inner.status || '').trim().toLowerCase();
    const responseCode = String(inner.responsecode || '').trim();

    let status: ParsedCallback['status'];
    if (
      responseCode === '01' ||
      statusStr === 'successfull' ||
      statusStr === 'successful' ||
      statusStr === 'completed'
    ) {
      status = 'COMPLETED';
    } else if (statusStr === 'pending' || responseCode === '1000') {
      status = 'PENDING';
    } else {
      // Covers 'failed', 'timeout', 'declined', etc.
      status = 'FAILED';
    }

    return {
      providerReference: inner.transactionid || inner.requesttransactionid,
      requestTransactionId: inner.requesttransactionid,
      status,
      rawResponse: body,
    };
  }
}

export function buildIntouchPayCallbackAck(requestId: string) {
  return { message: 'success', success: true, request_id: requestId };
}