import { Router } from 'express';
import { ScoreService } from '../services/score.service';
import { AuthRequest, requireAuth } from '../middlewares/auth';

const router = Router();

router.post('/batch', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.id;
    const scores = req.body.scores;

    if (!Array.isArray(scores)) {
      return res.status(400).json({ error: 'Scores must be an array' });
    }

    const role = req.user!.role;
    
    if (role !== 'TEACHER' && role !== 'PRINCIPAL' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Requires TEACHER role' });
    }

    const results = await ScoreService.processBatchScores(schoolId, userId, scores, role);
    res.json({ message: 'Scores synchronized successfully', count: results.length });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('Enrollment not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
