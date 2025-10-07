import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
    const { paid, month, customer_name } = req.query;
    const user = req.user!;
    const where: Prisma.PaymentWhereInput = {};
    // Add filtering logic here
    if (user.role.startsWith('RESELLER')) {
        where.customer = { resellerId: user.resellerId };
    } else {
        where.customer = { user: { tenantId: user.tenantId } };
    }
    const payments = await prisma.payment.findMany({ where, include: { customer: { select: { name: true } } } });
    res.json(payments);
});

router.post('/', async (req: AuthRequest, res) => {
    const { customerId, bill_amount, amount_paid, billing_month, payment_method, note } = req.body;
    const newPayment = await prisma.payment.create({
        data: { customerId, bill_amount, amount_paid, billing_month, payment_method, note, paid: amount_paid >= bill_amount }
    });
    res.status(201).json(newPayment);
});
export default router;