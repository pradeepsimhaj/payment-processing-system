import { createPaymentSchema } from '../../../validators/payment.validator';

describe('Payment Validator', () => {
  it('should validate correct payload', () => {
    const result = createPaymentSchema.parse({
      amount: 100,
      currency: 'INR',
    });

    expect(result.amount).toBe(100);
  });

  it('should reject negative amount', () => {
    expect(() =>
      createPaymentSchema.parse({
        amount: -100,
        currency: 'INR',
      }),
    ).toThrow();
  });

  it('should reject invalid currency', () => {
    expect(() =>
      createPaymentSchema.parse({
        amount: 100,
        currency: 'INDIA',
      }),
    ).toThrow();
  });

  it('should reject missing amount', () => {
    expect(() =>
      createPaymentSchema.parse({
        currency: 'INR',
      }),
    ).toThrow();
  });
});