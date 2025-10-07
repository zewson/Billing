import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

// Middleware to check for Super Admin Role
const isSuperAdmin = (req: AuthRequest, res: Response, next: Function) => {
    if (req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Access forbidden.' });
    }
    next();
};

router.get('/', isSuperAdmin, async (req, res) => {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(tenants);
});

router.post('/', isSuperAdmin, async (req, res) => {
    const { name, subdomain, defaultInfrastructure } = req.body;
    try {
        const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
        if (!adminRole) return res.status(500).json({ message: "ADMIN role not found" });

        const newTenant = await prisma.tenant.create({
            data: { name, subdomain, defaultInfrastructure },
        });

        const defaultPassword = `${subdomain}123`;
        const hashedPassword = await hash(defaultPassword, 12);
        
        await prisma.user.create({
            data: {
                email: `admin@${subdomain}.com`,
                name: `${name} Admin`,
                password: hashedPassword,
                roleId: adminRole.id,
                tenantId: newTenant.id,
            }
        });

        res.status(201).json({ 
            tenant: newTenant,
            defaultAdmin: { email: `admin@${subdomain}.com`, password: defaultPassword }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create tenant.' });
    }
});

export default router;