import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db/database';
import { initializeScheduler } from './services/scheduler';
import logger from './utils/logger';

// Import routes
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import membersRouter from './routes/members';
import eventsRouter from './routes/events';
import absencesRouter from './routes/absences';
import bossAssignmentsRouter from './routes/boss-assignments';
import fightPreferencesRouter from './routes/fight-preferences';
import bossKillsRouter from './routes/boss-kills';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/members', membersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/absences', absencesRouter);
app.use('/api/boss-assignments', bossAssignmentsRouter);
app.use('/api/fight-preferences', fightPreferencesRouter);
app.use('/api/boss-kills', bossKillsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, '../client/dist');
logger.info(`Serving static files from: ${clientBuildPath}`);
app.use(express.static(clientBuildPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  
  // Initialize scheduled tasks
  initializeScheduler();
});

export default app;
