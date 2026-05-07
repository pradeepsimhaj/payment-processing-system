describe('Environment Validation', () => {
  it('should have required environment variables', () => {
    expect(process.env.PORT)
      .toBeDefined();

    expect(
      process.env.DATABASE_URL,
    ).toBeDefined();

    expect(
      process.env.REDIS_HOST,
    ).toBeDefined();

    expect(
      process.env.REDIS_PORT,
    ).toBeDefined();
  });
});