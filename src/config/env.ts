import dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string(),

  DATABASE_URL: z.string(),

  REDIS_HOST: z.string(),

  REDIS_PORT: z.string(),
});

const parsed =
  envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables',
  );

  console.error(
    parsed.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsed.data;