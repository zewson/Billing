import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    const { role } = req.query;
    if (!role) return res.status(400).json({ message: "Role is required." });
    try {
        const users = await prisma.user.findMany({
            where: { role: { name: role as string } },
            select: { id: true, name: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

export default router;