import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './features/auth/auth.routes.js';
import usersRoutes from './features/users/users.routes.js';
import rolesRoutes from './features/roles/roles.routes.js';
import permissionsRoutes from './features/permissions/permissions.routes.js';
import rolePermissionsRoutes from './features/role-permissions/role-permissions.routes.js';
import userRolesRoutes from './features/user-roles/user-roles.routes.js';
import departmentsRoutes from './features/departments/departments.routes.js';
import designationsRoutes from './features/designations/designations.routes.js';
import userPermissionsRoutes from './features/user-permissions/user-permissions.routes.js';
import projectsRoutes from './features/projects/projects.routes.js';
import tasksRoutes from './features/tasks/tasks.routes.js';
import reportsRoutes from './features/reports/reports.routes.js';
import profileRoutes from './features/profile/profile.routes.js';
import timesheetsRoutes from './features/timesheets/timesheets.routes.js';
import timeTrackingRoutes from './features/time-tracking/time-tracking.routes.js';
import hrRoutes from './features/hr/hr.routes.js';
import projectFilesRoutes from './features/project-files/project-files.routes.js';
import projectNotesRoutes from './features/project-notes/project-notes.routes.js';
import notificationRoutes from './features/notifications/notifications.routes.js';
import quotationRoutes from './features/quotations/quotation.routes.js';
import salesRoutes from './features/sales/sales.routes.js';
import clientsRoutes from './features/clients/clients.routes.js';
import milestonesRoutes from './features/milestones/milestones.routes.js';
import pollsRoutes from './features/polls/polls.routes.js';

import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

// Core middleware
app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/permissions', permissionsRoutes);
app.use('/api/v1/role-permissions', rolePermissionsRoutes);
app.use('/api/v1/user-roles', userRolesRoutes);
app.use('/api/v1/departments', departmentsRoutes);
app.use('/api/v1/designations', designationsRoutes);
app.use('/api/v1/user-permissions', userPermissionsRoutes);
app.use('/api/v1/projects', projectsRoutes);           // includes /projects/:id/members via nested router
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/timesheets', timesheetsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tasks/time-tracking', timeTrackingRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/v1/project-files', projectFilesRoutes);
app.use('/api/v1/project-notes', projectNotesRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/milestones', milestonesRoutes);
app.use('/api/v1/polls', pollsRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorMiddleware);

export default app;
