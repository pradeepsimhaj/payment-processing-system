import { Router } from 'express';

import { PaymentController } from '../controllers/payment.controller';

const router = Router();

const paymentController = new PaymentController();

router.post('/', paymentController.createPayment);

router.get('/:id', paymentController.getPaymentById);

export default router;