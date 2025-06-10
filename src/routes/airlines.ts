import express from 'express';
import { basicAccess } from '../middleware/featureAccess';
import JwtManager, { UserTier } from '../utils/jwtManager';
import { airlinesService, SubscriptionTier } from '../services/airlinesService';
import { validateData } from '../middleware/validationMiddleware';
import { z } from 'zod';

const router = express.Router();

const countryParamsSchema = z.object({
  country: z.string().min(1, 'Country name is required'),
});

const tierParamsSchema = z.object({
  tier: z.nativeEnum(UserTier),
});

const mapUserTierToSubscriptionTier = (
  userTier: UserTier
): SubscriptionTier => {
  switch (userTier) {
    case UserTier.FREE:
      return SubscriptionTier.FREE;
    case UserTier.PRO:
      return SubscriptionTier.PRO;
    case UserTier.ELITE:
      return SubscriptionTier.ELITE;
    default:
      return SubscriptionTier.FREE;
  }
};

const getUserTier = (req: express.Request): UserTier => {
  if (!req.cookies.Authorization) {
    return UserTier.FREE;
  }

  const token = req.cookies.Authorization.split(' ')[1];
  const validation = JwtManager.verifyToken(token);
  return validation.payload?.tier || UserTier.FREE;
};

router.get('/', basicAccess, (req, res) => {
  try {
    const userTier = getUserTier(req);
    const subscriptionTier = mapUserTierToSubscriptionTier(userTier);

    const airlinesData = airlinesService.getAirlinesByTier(subscriptionTier);
    const statistics = airlinesService.getTierStatistics(subscriptionTier);

    res.json({
      success: true,
      tier: userTier,
      data: airlinesData,
      metadata: {
        totalAirlines: statistics.totalAirlines,
        totalCountries: statistics.totalCountries,
        accessibleCountries: statistics.countriesWithData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

router.get('/countries', basicAccess, (req, res) => {
  try {
    const userTier = getUserTier(req);
    const subscriptionTier = mapUserTierToSubscriptionTier(userTier);

    const accessibleCountries =
      airlinesService.getAccessibleCountries(subscriptionTier);

    res.json({
      success: true,
      tier: userTier,
      countries: accessibleCountries,
      totalCount: accessibleCountries.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

router.get(
  '/country/:country',
  basicAccess,
  validateData(countryParamsSchema, 'params'),
  (req, res) => {
    try {
      const userTier = getUserTier(req);
      const subscriptionTier = mapUserTierToSubscriptionTier(userTier);
      const { country } = req.params;

      if (!airlinesService.hasCountryAccess(subscriptionTier, country)) {
        res.status(403).json({
          success: false,
          error: `Access to '${country}' requires a higher subscription tier`,
          currentTier: userTier,
          requiredTier: country === 'United States' ? 'free' : 'pro',
        });
        return;
      }

      const airlines = airlinesService.getAirlinesByCountry(
        subscriptionTier,
        country
      );

      res.json({
        success: true,
        tier: userTier,
        country,
        airlines,
        count: airlines.length,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not accessible')) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }
);

router.get('/statistics', basicAccess, (req, res) => {
  try {
    const userTier = getUserTier(req);
    const subscriptionTier = mapUserTierToSubscriptionTier(userTier);

    const statistics = airlinesService.getTierStatistics(subscriptionTier);

    res.json({
      success: true,
      tier: userTier,
      statistics: {
        ...statistics,
        accessLevel:
          subscriptionTier === SubscriptionTier.ELITE
            ? 'unlimited'
            : 'restricted',
        tierBenefits: {
          [UserTier.FREE]: 'Access to United States airlines only',
          [UserTier.PRO]:
            'Access to 11 major countries including USA, Canada, UK, and more',
          [UserTier.ELITE]:
            'Unlimited access to all countries and airlines worldwide',
        }[userTier],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

router.get(
  '/access/:country',
  basicAccess,
  validateData(countryParamsSchema, 'params'),
  (req, res) => {
    try {
      const userTier = getUserTier(req);
      const subscriptionTier = mapUserTierToSubscriptionTier(userTier);
      const { country } = req.params;

      const hasAccess = airlinesService.hasCountryAccess(
        subscriptionTier,
        country
      );

      res.json({
        success: true,
        tier: userTier,
        country,
        hasAccess,
        message: hasAccess
          ? `Access granted to ${country}`
          : `Access to ${country} requires a higher subscription tier`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

router.get(
  '/tier/:tier/preview',
  basicAccess,
  validateData(tierParamsSchema, 'params'),
  (req, res) => {
    try {
      const currentUserTier = getUserTier(req);
      const previewTier = req.params.tier as UserTier;
      const subscriptionTier = mapUserTierToSubscriptionTier(previewTier);

      const statistics = airlinesService.getTierStatistics(subscriptionTier);
      const accessibleCountries =
        airlinesService.getAccessibleCountries(subscriptionTier);

      res.json({
        success: true,
        currentTier: currentUserTier,
        previewTier,
        preview: {
          totalAirlines: statistics.totalAirlines,
          totalCountries: statistics.totalCountries,
          sampleCountries: accessibleCountries.slice(0, 5),
          allCountries: accessibleCountries,
          upgrade:
            previewTier !== currentUserTier
              ? {
                  message: `Upgrade to ${previewTier} tier to access this data`,
                  benefits: `Get access to ${statistics.totalCountries} countries and ${statistics.totalAirlines} airlines`,
                }
              : null,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default router;
