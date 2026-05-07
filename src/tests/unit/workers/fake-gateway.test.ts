import {
  processFakePayment,
} from '../../../gateway/fake-gateway';

describe('Fake Gateway', () => {
  it('should return valid gateway response shape', async () => {
    const response =
      await processFakePayment();

    expect(response).toHaveProperty('success');

    if (response.success) {
      expect(response).toHaveProperty(
        'transactionId',
      );
    }
  });
});