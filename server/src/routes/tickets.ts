import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { io } from '../index';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    const tickets = await prisma.ticket.findMany({ include: { customer: { select: { name: true } } } });
    res.json(tickets);
});

router.post('/', async (req: AuthRequest, res) => {
    const { title, description, priority, customerId } = req.body;
    const createdById = req.user!.userId;
    const newTicket = await prisma.ticket.create({
        data: { title, description, priority, customerId, createdById }
    });
    // Notify admins
    io.to('admin_room').emit('new_notification', { message: `New ticket: ${title}` });
    res.status(201).json(newTicket);
});
// Add other ticket routes (GET by ID, PATCH, POST replies) here
export default router;