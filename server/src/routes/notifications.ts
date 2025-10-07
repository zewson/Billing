import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

router.post('/mark-as-read', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        await prisma.notification.updateMany({
            where: { userId: userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notifications' });
    }
});

export default router;