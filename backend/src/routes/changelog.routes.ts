import { Router } from 'express';
import { ChangeLogController } from '../controllers/changelog.controller';
import { authenticateToken } from '../middleware/auth';
import { requireAnyRole, requireGMOrAdmin } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/all', requireGMOrAdmin, ChangeLogController.getAllChangeLogs);
router.get('/:characterId', requireAnyRole, ChangeLogController.getChangeLogsByCharacter);
router.get('/:characterId/export', requireAnyRole, ChangeLogController.exportChangeLog);

export default router;
