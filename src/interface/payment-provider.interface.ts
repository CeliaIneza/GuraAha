export interface InitiatePaymentInput {
  userId: string;
  phone: string;
  amountRwf: number;
  internalPaymentId: string;
}

export interface InitiatePaymentResult {
  providerReference: string;
  rawResponse: unknown;
}

export interface ParsedCallback {
  providerReference: string;
  status: 'COMPLETED' | 'FAILED';
  rawResponse: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;

  parseCallback(
    rawBody: unknown,
    headers: Record<string, string | string[] | undefined>
  ): ParsedCallback;
}