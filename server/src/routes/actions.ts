import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { togglePppUser } from '../utils/mikrotik';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.post('/toggle-status', async (req: AuthRequest, res) => {
    const { username, is_active } = req.body;

    if (!username || typeof is_active !== 'boolean') {
        return res.status(400).json({ message: 'Username and is_active (boolean) are required.' });
    }

    try {
        const customer = await prisma.customer.findUnique({ where: { username } });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found in our database.' });
        }

        const shouldDisable = !is_active;
        const mikrotikResult = await togglePppUser(username, shouldDisable);

        if (!mikrotikResult.success) {
            return res.status(400).json({ message: mikrotikResult.message });
        }

        await prisma.customer.update({
            where: { username },
            data: { is_active },
        });

        res.status(200).json({ message: mikrotikResult.message });
    } catch (error) {
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

export default router;