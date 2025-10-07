import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    const resellers = await prisma.reseller.findMany();
    res.json(resellers);
});

router.post('/', async (req: AuthRequest, res) => {
    const { name, phone, email, commissionRate } = req.body;
    const tenantId = req.user!.tenantId;
    try {
        const resellerRole = await prisma.role.findFirst({ where: { name: 'RESELLER_ADMIN' }});
        if (!resellerRole) return res.status(500).json({ message: "RESELLER_ADMIN role not found" });

        const newReseller = await prisma.reseller.create({
            data: { name, phone, email, commissionRate, tenantId },
        });

        const defaultPassword = `${name.split(' ')[0].toLowerCase()}123`;
        const hashedPassword = await hash(defaultPassword, 12);
        
        await prisma.user.create({
            data: {
                email: newReseller.email!,
                name: `${newReseller.name} (Admin)`,
                password: hashedPassword,
                roleId: resellerRole.id,
                tenantId: tenantId,
                resellerId: newReseller.id,
            }
        });

        res.status(201).json({ 
            reseller: newReseller,
            defaultAdmin: { email: newReseller.email, password: defaultPassword }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create reseller.' });
    }
});

export default router;