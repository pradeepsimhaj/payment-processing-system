import { Request, Response, NextFunction } from 'express';

import { PaymentService } from '../services/payment.service';

import { createPaymentSchema } from '../validators/payment.validator';

const paymentService = new PaymentService();

export class PaymentController {
  async createPayment(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validatedData = createPaymentSchema.parse(req.body);

      const idempotencyKey = req.header('Idempotency-Key');

      const payment = await paymentService.createPayment(
        validatedData,
        idempotencyKey || undefined,
      );

      return res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payment = await paymentService.getPaymentById(
        String(req.params.id,)
      );

      return res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
}