import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { startDeactivationJob } from './jobs/deactivationJob';

// Import all routers
import authRouter from './routes/auth';
import tenantsRouter from './routes/tenants';
import customersRouter from './routes/customers';
import packagesRouter from './routes/packages';
import paymentsRouter from './routes/payments';
import dashboardRouter from './routes/dashboard';
import billingRouter from './routes/billing';
import actionsRouter from './routes/actions';
import resellersRouter from './routes/resellers';
import resellerStaffRouter from './routes/resellerStaff';
import resellerPermissionsRouter from './routes/resellerPermissions';
import ticketsRouter from './routes/tickets';
import usersRouter from './routes/users';
import customerPortalRouter from './routes/customerPortal';
import buildsRouter from './routes/builds';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api/auth', authRouter); 
app.use('/api/tenants', tenantsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/billing', billingRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/resellers', resellersRouter);
app.use('/api/reseller-staff', resellerStaffRouter);
app.use('/api/reseller-permissions', resellerPermissionsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/users', usersRouter);
app.use('/api/customer-portal', customerPortalRouter);
app.use('/api/builds', buildsRouter);
app.use('/api/notifications', notificationsRouter);

// Socket.io connection logic
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.join(String(userId));
    }
    socket.on('disconnect', () => {});
});

export { io };

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  startDeactivationJob();
});