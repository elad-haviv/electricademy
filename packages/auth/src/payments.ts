/**
 * Payment provider abstraction. The MVP ships only the stub; a real provider
 * (Stripe, or an Israeli processor such as Grow/Cardcom) implements this
 * interface and its webhook writes to the `subscription` / `entitlement` tables.
 */
export interface CheckoutRequest {
  userId: string;
  email: string;
  /** "pro_monthly", "pro_yearly", or a product slug such as "license_exam". */
  sku: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentProvider {
  readonly id: string;
  createCheckout(req: CheckoutRequest): Promise<{ redirectUrl: string }>;
}

export const stubPaymentProvider: PaymentProvider = {
  id: "stub",
  async createCheckout(req) {
    const url = new URL(req.cancelUrl);
    url.searchParams.set("checkout", "unavailable");
    url.searchParams.set("sku", req.sku);
    return { redirectUrl: url.toString() };
  },
};

export const PRICING = [
  { sku: "pro_monthly", priceIls: 39, interval: "month" },
  { sku: "pro_yearly", priceIls: 349, interval: "year" },
] as const;
