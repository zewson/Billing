import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getMonthName } from '../utils/dateUtils';
import { deactivateDuePaymentCustomers } from '../jobs/deactivationJob';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.post('/generate', async (req, res) => {
    try {
        const month = getMonthName();
        const activeCustomers = await prisma.customer.findMany({
            where: { is_active: true, package: { price: { gt: 0 } } },
            include: { package: true },
        });
        const existingPayments = await prisma.payment.findMany({
            where: { billing_month: month },
            select: { customerId: true },
        });
        const paidCustomerIds = new Set(existingPayments.map(p => p.customerId));
        const customersToBill = activeCustomers.filter(c => !paidCustomerIds.has(c.id));
        const paymentsToCreate = customersToBill.map(customer => ({
            customerId: customer.id,
            bill_amount: customer.package?.price || 0.0,
            billing_month: month,
            note: `Auto-generated bill for ${month}`,
        }));

        if (paymentsToCreate.length > 0) {
            await prisma.payment.createMany({ data: paymentsToCreate });
        }
        
        res.status(200).json({
            message: `Billing for ${month} processed.`,
            created_payments_count: paymentsToCreate.length,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate bills', error });
    }
});

router.post('/run-deactivation', async (req, res) => {
    try {
        deactivateDuePaymentCustomers();
        res.status(202).json({ message: 'Deactivation process has been started in the background.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to start deactivation process.', error });
    }
});

export default router;