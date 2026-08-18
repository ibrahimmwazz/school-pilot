import express from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { CommunicationsService } from '../services/communications.service';
import prisma from '../services/db';

const router = express.Router();
router.use(requireAuth);

router.get('/recipients', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    if (req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const teachers = await prisma.user.findMany({
      where: {
        schoolId,
        role: { in: ['TEACHER', 'FORM_MASTER'] }
      },
      select: {
        id: true,
        email: true
      },
      orderBy: { email: 'asc' },
      take: 1000
    });

    const parents = await prisma.guardian.findMany({
      where: {
        guardianLinks: {
          some: {
            student: {
              schoolId
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true
      },
      orderBy: { lastName: 'asc' },
      take: 1000
    });

    const classes = await prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        arm: true
      },
      orderBy: [{ name: 'asc' }, { arm: 'asc' }],
      take: 1000
    });

    res.json({ teachers, parents, classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/broadcast', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const senderId = req.user?.id;
    if (!schoolId || !senderId) return res.status(401).json({ message: 'Unauthorized' });

    if (req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { content, targetType, targetIds } = req.body;
    if (!content) return res.status(400).json({ message: 'content is required' });
    if (!targetType) return res.status(400).json({ message: 'targetType is required' });

    const logs = await CommunicationsService.broadcastMessage(schoolId, senderId, content, targetType, targetIds);
    res.json({ message: 'Broadcast successful', logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const logs = await prisma.messageLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
