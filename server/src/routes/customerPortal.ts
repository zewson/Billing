import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

// GET Dashboard data for the logged-in customer
router.get('/dashboard', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: {
                package: true,
                payments: { where: { paid: false } }
            }
        });
        if (!customer) return res.status(404).json({ message: "Customer profile not found." });

        const totalDue = customer.payments.reduce((sum, p) => sum + Number(p.bill_amount), 0);
        res.json({
            name: customer.name,
            status: customer.is_active ? 'Active' : 'Inactive',
            packageName: customer.package?.name,
            packagePrice: customer.package?.price,
            totalDue,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch dashboard data.' });
    }
});

// GET Payment history for the logged-in customer
router.get('/payments', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const customer = await prisma.customer.findFirst({ where: { userId } });
        if (!customer) return res.status(404).json({ message: "Customer not found." });
        const payments = await prisma.payment.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch payment history.' });
    }
});

// POST Create a new ticket for the logged-in customer
router.post('/tickets', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { title, description, priority } = req.body;
    try {
        const customer = await prisma.customer.findFirst({ where: { userId } });
        if (!customer) return res.status(404).json({ message: "Customer profile not found." });

        const newTicket = await prisma.ticket.create({
            data: { title, description, priority, customerId: customer.id, createdById: userId }
        });
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create ticket.' });
    }
});
// Add more customer portal routes here

export default router;