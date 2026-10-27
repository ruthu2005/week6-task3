import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Base health route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Week 6 Task 3: Role-Based Authorization API is active.',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth (register, login, me)',
      admin: '/api/admin (dashboard, users, users/:id/role)'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount modular route handlers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
