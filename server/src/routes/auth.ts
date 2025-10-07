import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });

        if (!user) { return res.status(401).json({ message: 'Invalid credentials.' }); }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) { return res.status(401).json({ message: 'Invalid credentials.' }); }

        const permissions = user.role.permissions.map(p => p.permission.name);

        const token = jwt.sign(
          { 
            userId: user.id, 
            role: user.role.name,
            resellerId: user.resellerId,
            tenantId: user.tenantId,
            permissions: permissions,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '1d' }
        );

        res.status(200).json({
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
});

export default router;