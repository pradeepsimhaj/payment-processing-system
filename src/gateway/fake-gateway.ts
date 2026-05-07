export interface GatewayResponse {
  success: boolean;

  transactionId?: string;

  failureReason?: string;

  timeout?: boolean;
}

function randomDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 3000);

  return new Promise((resolve) =>
    setTimeout(resolve, delay),
  );
}

export async function processFakePayment(): Promise<GatewayResponse> {
  await randomDelay();

  const random = Math.random();

  if (random < 0.6) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
    };
  }

  if (random < 0.85) {
    return {
      success: false,
      failureReason: 'Gateway processing failed',
    };
  }

  return {
    success: false,
    timeout: true,
    failureReason: 'Gateway timeout',
  };
}