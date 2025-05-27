import { z } from 'zod';
import { UserTier } from '../utils/jwtManager';

export const tokenCreateSchema = z.object({
  tier: z.nativeEnum(UserTier),
});

export type TokenCreateSchema = z.infer<typeof tokenCreateSchema>;
