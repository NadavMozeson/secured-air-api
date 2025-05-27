import jwt from 'jsonwebtoken';

export enum UserTier {
  FREE = 'free',
  PRO = 'pro',
  ELITE = 'elite',
}

export interface TokenPayload {
  tier: UserTier;
  iat?: number;
  exp?: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
  tier?: UserTier;
}

class JwtManager {
  private static readonly secretKey =
    process.env.JWT_SECRET || 'fallback-secret-key';
  private static readonly expiresIn = process.env.JWT_EXPIRES || '30m';

  private constructor() {}

  public static generateToken(tier: UserTier): string | null {
    if (tier === UserTier.FREE) {
      return null;
    }

    const tokenPayload: TokenPayload = {
      tier,
    };

    return jwt.sign(tokenPayload, this.secretKey, {
      expiresIn: this.expiresIn,
    } as jwt.SignOptions);
  }

  public static verifyToken(token: string): TokenValidationResult {
    if (!token) {
      return {
        isValid: false,
        error: 'No token provided',
      };
    }

    try {
      const payload = jwt.verify(token, this.secretKey) as TokenPayload;

      if (!Object.values(UserTier).includes(payload.tier)) {
        return {
          isValid: false,
          error: 'Invalid tier in token',
        };
      }

      return {
        isValid: true,
        payload,
        tier: payload.tier,
      };
    } catch (error) {
      let errorMessage = 'Token verification failed';

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token';
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not active yet';
      }

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  public static requiresAuthentication(tier: UserTier): boolean {
    return tier !== UserTier.FREE;
  }

  public static validateTierAccess(
    token: string | null,
    requiredTier: UserTier
  ): TokenValidationResult {
    if (requiredTier === UserTier.FREE) {
      return {
        isValid: true,
        tier: UserTier.FREE,
      };
    }

    if (!token) {
      return {
        isValid: false,
        error: `${requiredTier} tier requires authentication`,
      };
    }

    const validation = this.verifyToken(token);

    if (!validation.isValid) {
      return validation;
    }

    const userTier = validation.payload!.tier;
    const tierHierarchy = {
      [UserTier.FREE]: 0,
      [UserTier.PRO]: 1,
      [UserTier.ELITE]: 2,
    };

    if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
      return {
        isValid: false,
        error: `Insufficient permissions. Required: ${requiredTier}, Current: ${userTier}`,
      };
    }

    return validation;
  }

  public static getTierFeatures(tier: UserTier): string[] {
    const features = {
      [UserTier.FREE]: ['basic_access'],
      [UserTier.PRO]: ['basic_access', 'pro_features'],
      [UserTier.ELITE]: ['basic_access', 'pro_features', 'elite_features'],
    };

    return features[tier] || [];
  }
}

export default JwtManager;
