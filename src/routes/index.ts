import express from 'express';
import packageJson from '../../package.json';
import { basicAccess } from '../middleware/featureAccess';

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

export default router;
