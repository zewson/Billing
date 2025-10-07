import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getMonthName } from '../utils/dateUtils';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const current_month = getMonthName();
    const customerStats = await prisma.customer.aggregate({ _count: { id: true } });
    const activeCustomersCount = await prisma.customer.count({ where: { is_active: true } });
    const totalPackages = await prisma.package.count();
    const paymentStats = await prisma.payment.aggregate({
        _count: { id: true },
        _sum: { amount_paid: true },
        where: { paid: true },
    });
    const pendingPaymentsCount = await prisma.payment.count({ where: { paid: false } });
    
    res.json({
        total_customers: customerStats._count.id,
        active_customers: activeCustomersCount,
        total_packages: totalPackages,
        total_payments: paymentStats._count.id,
        total_revenue: paymentStats._sum.amount_paid || 0.0,
        pending_payments: pendingPaymentsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

export default router;