import { Response } from 'express';
import { AuthRequest, MergeDecision } from '../types';
import { CharacterService } from '../services/character.service';
import { CharacterModel } from '../models/character.model';
import multer from 'multer';
import { config } from '../config';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
});

export class CharacterController {
  static uploadMiddleware = upload.single('file');

  static async getAllCharacters(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const characters = await CharacterService.getCharactersForUser(
        req.user.id,
        req.user.role
      );

      res.json(characters);
    } catch (error: any) {
      console.error('Get characters error:', error);
      res.status(500).json({ error: 'Failed to get characters' });
    }
  }

  static async getCharacterById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const canAccess = await CharacterService.canUserAccessCharacter(
        req.user.id,
        req.user.role,
        id
      );

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const character = await CharacterModel.findById(id);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      res.json(CharacterModel.toDTO(character));
    } catch (error: any) {
      console.error('Get character error:', error);
      res.status(500).json({ error: 'Failed to get character' });
    }
  }

  static async importCharacter(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      let jsonData;
      let filename;

      // Check if file upload or JSON body
      if (req.file) {
        const fileContent = req.file.buffer.toString('utf-8');
        jsonData = JSON.parse(fileContent);
        filename = req.file.originalname;
      } else if (req.body.jsonData) {
        jsonData = req.body.jsonData;
        filename = req.body.filename;
      } else {
        return res.status(400).json({ error: 'No character data provided' });
      }

      // Validate character data
      if (!jsonData.name || !jsonData.system) {
        return res.status(400).json({ error: 'Invalid FVTT character format' });
      }

      const result = await CharacterService.importCharacter(
        req.user.id,
        jsonData,
        filename
      );

      if (result.needsMerge) {
        res.json({
          message: 'Character already exists. Merge required.',
          needsMerge: true,
          characterId: result.character.id,
          diffs: result.diffs,
        });
      } else {
        res.status(201).json({
          message: 'Character imported successfully',
          needsMerge: false,
          character: CharacterModel.toDTO(result.character),
        });
      }
    } catch (error: any) {
      console.error('Import character error:', error);
      res.status(500).json({ error: error.message || 'Failed to import character' });
    }
  }

  static async mergeCharacter(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { importedData, mergeDecisions } = req.body;

      if (!importedData || !mergeDecisions) {
        return res.status(400).json({ error: 'Imported data and merge decisions required' });
      }

      const canAccess = await CharacterService.canUserAccessCharacter(
        req.user.id,
        req.user.role,
        id
      );

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await CharacterService.mergeCharacter(
        id,
        req.user.id,
        importedData,
        mergeDecisions as MergeDecision[]
      );

      res.json(result);
    } catch (error: any) {
      console.error('Merge character error:', error);
      res.status(500).json({ error: error.message || 'Failed to merge character' });
    }
  }

  static async updateCharacter(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { fieldPath, value } = req.body;

      if (!fieldPath) {
        return res.status(400).json({ error: 'Field path required' });
      }

      const canAccess = await CharacterService.canUserAccessCharacter(
        req.user.id,
        req.user.role,
        id
      );

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updated = await CharacterService.updateField(
        id,
        req.user.id,
        fieldPath,
        value
      );

      res.json(CharacterModel.toDTO(updated));
    } catch (error: any) {
      console.error('Update character error:', error);
      res.status(500).json({ error: error.message || 'Failed to update character' });
    }
  }

  static async deleteCharacter(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      const canAccess = await CharacterService.canUserAccessCharacter(
        req.user.id,
        req.user.role,
        id
      );

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await CharacterModel.delete(id);

      res.json({ message: 'Character deleted successfully' });
    } catch (error: any) {
      console.error('Delete character error:', error);
      res.status(500).json({ error: 'Failed to delete character' });
    }
  }
}
