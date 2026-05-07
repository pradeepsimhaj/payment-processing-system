import redis from '../config/redis';

const LOCK_TTL = 30000;

export async function acquirePaymentLock(
  paymentId: string,
): Promise<boolean> {
  const lockKey = `lock:payment:${paymentId}`;

  const result = await redis.set(
    lockKey,
    'locked',
    'PX',
    LOCK_TTL,
    'NX',
  );

  return result === 'OK';
}

export async function releasePaymentLock(
  paymentId: string,
): Promise<void> {
  const lockKey = `lock:payment:${paymentId}`;

  await redis.del(lockKey);
}