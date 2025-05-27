import express from 'express';
import packageJson from '../../package.json';
import { basicAccess } from '../middleware/featureAccess';
import JwtManager, { UserTier } from '../utils/jwtManager';
import { validateData } from '../middleware/validationMiddleware';
import { tokenCreateSchema } from './types';

const router = express.Router();

router.get('/', basicAccess, (req, res) => {
  res.send('Welcome to Secured Air API');
});

router.get('/health', basicAccess, (req, res) => {
  let tier = UserTier.FREE;
  if (req.cookies.Authorization) {
    const token = req.cookies.Authorization.split(' ')[1];
    const validation = JwtManager.verifyToken(token);
    tier = validation.payload?.tier || UserTier.FREE;
  }

  res.send({
    name: packageJson.name,
    version: packageJson.version,
    status: 'OK',
    timestamp: new Date().toISOString(),
    startupTime: new Date(new Date().getTime() - process.uptime() * 1000),
    uptime: process.uptime(),
    tier,
  });
});

router.get(
  '/token/:tier',
  basicAccess,
  validateData(tokenCreateSchema, 'params'),
  (req, res) => {
    const { tier } = req.params;
    const token = JwtManager.generateToken(tier as UserTier);

    if (token) {
      res.cookie('Authorization', 'Bearer ' + token, {
        httpOnly: true,
        secure: process.env.PRODUCTION === 'production',
        sameSite: process.env.PRODUCTION === 'production' ? 'none' : 'lax',
        maxAge: 30 * 60 * 1000,
        path: '/',
      });
    }

    res.json({
      message: token
        ? 'Token set as cookie and returned'
        : 'Free tier - no token needed',
    });
  }
);

export default router;
