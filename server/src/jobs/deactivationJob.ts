import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { getMonthName } from '../utils/dateUtils';
import { togglePppUser } from '../utils/mikrotik';

export async function deactivateDuePaymentCustomers() {
    console.log('Running job: Deactivating customers with due payments...');
    const month = getMonthName();
    try {
        const unpaidPayments = await prisma.payment.findMany({
            where: { billing_month: month, paid: false, customer: { is_active: true } },
            include: { customer: true },
        });

        for (const payment of unpaidPayments) {
            const customer = payment.customer;
            if (customer && customer.username) {
                const result = await togglePppUser(customer.username, true);
                if (result.success) {
                    await prisma.customer.update({ where: { id: customer.id }, data: { is_active: false } });
                    console.log(`Deactivated ${customer.username}.`);
                } else {
                    console.error(`Failed to deactivate ${customer.username}: ${result.message}`);
                }
            }
        }
    } catch (error) {
        console.error('Deactivation job error:', error);
    }
}

export function startDeactivationJob() {
    cron.schedule('0 0 * * *', deactivateDuePaymentCustomers, { timezone: "Asia/Dhaka" });
    console.log('Customer deactivation job scheduled daily at midnight.');
}