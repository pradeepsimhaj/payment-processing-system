import {
  Request,
  Response,
  NextFunction,
} from 'express';

import { WebhookService }
  from '../services/webhook.service';

const webhookService =
  new WebhookService();

export class WebhookController {
  async handlePaymentWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await webhookService.processWebhook(
        req.body,
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}