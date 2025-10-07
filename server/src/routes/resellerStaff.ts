import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authMiddleware);

// Middleware to ensure only Reseller Admins can access
const isResellerAdmin = (req: AuthRequest, res: Response, next: Function) => {
    if (req.user?.role !== 'RESELLER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

router.get('/', isResellerAdmin, async (req: AuthRequest, res) => {
    const resellerId = req.user!.resellerId;
    const staff = await prisma.user.findMany({ where: { resellerId } });
    res.json(staff);
});

router.post('/', isResellerAdmin, async (req: AuthRequest, res) => {
    const { name, email, password, roleId } = req.body;
    const { resellerId, tenantId } = req.user!;
    const hashedPassword = await hash(password, 12);
    const newStaff = await prisma.user.create({
        data: { name, email, password: hashedPassword, roleId, resellerId, tenantId }
    });
    res.status(201).json(newStaff);
});

export default router;