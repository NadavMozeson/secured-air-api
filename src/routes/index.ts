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
  res.send({
    name: packageJson.name,
    version: packageJson.version,
    status: 'OK',
    timestamp: new Date().toISOString(),
    startupTime: new Date(new Date().getTime() - process.uptime() * 1000),
    uptime: process.uptime(),
  });
});

router.get(
  '/token/:tier',
  basicAccess,
  validateData(tokenCreateSchema, 'params'),
  (req, res) => {
    const { tier } = req.params;
    const token = JwtManager.generateToken(tier as UserTier);
    res.json({ token });
  }
);

export default router;
