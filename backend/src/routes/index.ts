import { Router } from 'express';
import authRoutes from './auth.routes';
import characterRoutes from './character.routes';
import changelogRoutes from './changelog.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);
router.use('/changelogs', changelogRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
