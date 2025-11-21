import { Router } from 'express';
import { CharacterController } from '../controllers/character.controller';
import { authenticateToken } from '../middleware/auth';
import { requireAnyRole } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireAnyRole);

router.get('/', CharacterController.getAllCharacters);
router.get('/:id', CharacterController.getCharacterById);
router.post(
  '/import',
  CharacterController.uploadMiddleware,
  CharacterController.importCharacter
);
router.post('/:id/merge', CharacterController.mergeCharacter);
router.put('/:id', CharacterController.updateCharacter);
router.delete('/:id', CharacterController.deleteCharacter);

export default router;
