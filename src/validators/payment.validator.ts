import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),

  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .transform((value) => value.toUpperCase()),
});