import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
    const packages = await prisma.package.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(packages);
});

router.post('/', authMiddleware, async (req, res) => {
    const { name, speed_mbps, price } = req.body;
    const newPackage = await prisma.package.create({ data: { name, speed_mbps, price } });
    res.status(201).json(newPackage);
});
// Add GET by ID, PATCH, DELETE routes here
export default router;