import crypto from 'node:crypto';
import {
  PaymentProvider,
  InitiatePaymentInput,
  InitiatePaymentResult,
  ParsedCallback,
} from '../interface/payment-provider.interface';
import { env } from '../config/env';

// TBD: confirm these env vars exist in your env schema.
// INTOUCHPAY_USERNAME, INTOUCHPAY_ACCOUNT_NO, INTOUCHPAY_PARTNER_PASSWORD,
// INTOUCHPAY_BASE_URL (sandbox vs production — see below),
// INTOUCHPAY_CALLBACK_URL (must be a publicly reachable URL IntouchPay can
// POST to — won't work against localhost without a tunnel).

const SANDBOX_URL = 'https://developer.intouchpay.co.rw/api/v1/sandbox/requestpayment/';
const PRODUCTION_URL = 'https://www.intouchpay.co.rw/api/requestpayment/';

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

interface RequestPaymentResponse {
  status: string;
  requesttransactionid: string;
  success: boolean;
  responsecode: string;
  transactionid?: string;
  message?: string;
  provider?: { code: string; name: string };
}

interface CallbackPayload {
  jsonpayload: {
    status: string;
    requesttransactionid: string;
    transactionfee: number;
    referenceno: string;
    currency: string;
    amount: number;
    responsecode: string;
    transactionid: string;
    statusdesc: string;
  };
}

export class IntouchPayProvider implements PaymentProvider {
  readonly name = 'INTOUCHPAY';

  private readonly baseUrl = env.INTOUCHPAY_BASE_URL ?? SANDBOX_URL;
  private readonly username = env.INTOUCHPAY_USERNAME;
  private readonly accountNo = env.INTOUCHPAY_ACCOUNT_NO;
  private readonly partnerPassword = env.INTOUCHPAY_PARTNER_PASSWORD;
  private readonly callbackUrl = env.INTOUCHPAY_CALLBACK_URL;

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!this.username || !this.accountNo || !this.partnerPassword || !this.callbackUrl) {
      throw new Error(
        'IntouchPay is not configured — missing one of INTOUCHPAY_USERNAME / INTOUCHPAY_ACCOUNT_NO / INTOUCHPAY_PARTNER_PASSWORD / INTOUCHPAY_CALLBACK_URL'
      );
    }

    const timestamp = formatTimestamp(new Date());
    const password = computePassword(this.username, this.accountNo, this.partnerPassword, timestamp);


    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        accountno: this.accountNo,
        timestamp,
        amount: input.amountRwf,
        password,
        mobilephone: input.phone,
        requesttransactionid: input.internalPaymentId,
        callbackurl: this.callbackUrl,
      }),
    });

    const raw = (await response.json()) as RequestPaymentResponse;

    if (!response.ok || !raw.success) {
      // TBD: raw.responsecode maps to a known table of errors (insufficient
      // funds, invalid number, etc. — see the list you pasted). Surfacing
      // raw.message as-is for now; consider mapping specific codes to
      // friendlier messages for the client later.
      throw new Error(`IntouchPay request failed (${raw.responsecode ?? response.status}): ${raw.message ?? 'Unknown error'}`);
    }

    if (!raw.transactionid) {
      throw new Error('IntouchPay response did not include a transactionid');
    }

    // Note: this immediate response only means "USSD prompt sent" — status
    // is "Pending" here regardless of what the user does next. The actual
    // completion/failure only arrives later via the callback in
    // parseCallback. Don't treat a successful initiate() as a successful
    // payment anywhere in the calling code.
    return { providerReference: raw.transactionid, rawResponse: raw };
  }

  parseCallback(
    rawBody: unknown,
    _headers: Record<string, string | string[] | undefined>
  ): ParsedCallback {
    const body = rawBody as CallbackPayload;
    const payload = body?.jsonpayload;

    if (!payload || typeof payload.requesttransactionid !== 'string' || typeof payload.transactionid !== 'string') {
      throw new Error('Malformed IntouchPay callback payload');
    }

    const status: ParsedCallback['status'] = payload.status === 'Successfull' || payload.status === 'Successful' ? 'COMPLETED' : 'FAILED';

    return {
      providerReference: payload.transactionid,
      status,
      rawResponse: body,
    };
  }
}

export function buildIntouchPayCallbackAck(requestId: string) {
  return { message: 'success', success: true, request_id: requestId };
}