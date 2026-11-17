export interface InitiatePaymentInput {
  userId: string;
  phone: string;
  amountRwf: number;
  internalPaymentId: string;
}

export interface InitiateDepositInput {
  userId?: string;
  phone: string;
  amountRwf: number;
  internalPaymentId: string;
  withdrawCharge?: number;
  reason?: string;
  sid?: string;
}

export interface InitiatePaymentResult {
  providerReference: string;
  rawResponse: unknown;
}

export interface ParsedCallback {
  providerReference: string;
  requestTransactionId?: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  rawResponse: unknown;
}

export interface TransactionStatusResult {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  rawResponse: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;

  initiateDeposit?(input: InitiateDepositInput): Promise<InitiatePaymentResult>;

  checkTransactionStatus?(
    requestTransactionId: string,
    providerReference?: string | null
  ): Promise<TransactionStatusResult>;

  parseCallback(
    rawBody: unknown,
    headers: Record<string, string | string[] | undefined>
  ): ParsedCallback;
}