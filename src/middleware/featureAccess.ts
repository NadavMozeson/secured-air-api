import { Request, Response, NextFunction } from 'express';
import JwtManager, { UserTier } from '../utils/jwtManager';

const requireFeature = (featureId: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    let userTier = UserTier.FREE;

    if (token) {
      const validation = JwtManager.verifyToken(token);

      if (!validation.isValid) {
        res.status(401).json({
          error: 'Invalid token',
          message: validation.error,
        });
        return;
      }

      userTier = validation.payload?.tier || UserTier.FREE;
    }

    const userFeatures = JwtManager.getTierFeatures(userTier);

    if (!userFeatures.includes(featureId)) {
      res.status(403).json({
        error: 'Access denied',
        message: `Feature '${featureId}' requires a higher tier`,
        requiredFeature: featureId,
        userTier,
        userFeatures,
      });
      return;
    }

    next();
  };
};

export const basicAccess = requireFeature('basic_access');
export const proFeatures = requireFeature('pro_features');
export const eliteFeatures = requireFeature('elite_features');
