import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  const { name, username, phone, packageId, isActive, isFree } = req.query;
  const user = req.user!;

  const where: Prisma.CustomerWhereInput = {
    // Basic filters
  };

  if (user.role === 'RESELLER_ADMIN' || user.role === 'RESELLER_STAFF') {
    where.resellerId = user.resellerId;
  } else {
    where.user = { tenantId: user.tenantId };
  }
  
  const customers = await prisma.customer.findMany({ where, include: { package: true } });
  res.json(customers);
});

router.post('/', async (req: AuthRequest, res) => {
    const { name, phone, email, username, packageId } = req.body;
    const user = req.user!;
    try {
        const userRole = await prisma.role.findFirst({ where: { name: 'USER' }});
        if (!userRole) return res.status(500).json({ message: "USER role not found" });

        const defaultPassword = `${username.slice(0, 4)}${phone?.slice(-4) || '1234'}`;
        const hashedPassword = await hash(defaultPassword, 12);

        const newCustomer = await prisma.customer.create({
            data: {
                name, phone, email, username, packageId,
                resellerId: user.role.startsWith('RESELLER') ? user.resellerId : undefined,
                user: {
                    create: {
                        email, name, password: hashedPassword,
                        roleId: userRole.id,
                        tenantId: user.tenantId,
                    }
                }
            }
        });
        res.status(201).json({ customer: newCustomer, defaultPassword });
    } catch (error) {
        res.status(500).json({ message: "Failed to create customer" });
    }// ... অন্যান্য import ...
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

// ... router.get('/') ...

// POST: Create a new customer AND a corresponding user account
router.post('/', async (req, res) => {
  const { name, phone, address, email, username, packageId, connection_type } = req.body;

  if (!name || !username || !email) {
    return res.status(400).json({ message: 'Name, username, and email are required.' });
  }

  try {
    // We need to find the ID of the 'USER' role
    const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
    if (!userRole) {
        return res.status(500).json({ message: "Initial 'USER' role not found in database." });
    }

    // Auto-generate a default password
    const defaultPassword = `${username.slice(0, 4)}${phone?.slice(-4) || '1234'}`;
    const hashedPassword = await hash(defaultPassword, 12);
    
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
        email,
        username,
        packageId,
        connection_type,
        // Create the linked User record at the same time
        user: {
            create: {
                email,
                name,
                password: hashedPassword,
                roleId: userRole.id,
                // tenantId will be added from auth middleware later
            }
        }
      },
    });

    res.status(201).json({ customer: newCustomer, defaultPassword });

  } catch (error) {
    // ... error handling ...
  }
});

// ... বাকি রাউটগুলো ...
});
// Add GET by ID, PATCH, and DELETE routes here following the same scoping logic
export default router;