import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import logger from '../utils/logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Normalize username to lowercase for case-insensitive comparison
    const normalizedUsername = username.toLowerCase().trim();

    // Check if username already exists (case-insensitive)
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(normalizedUsername);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with default Guest role (store normalized username)
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    ).run(normalizedUsername, passwordHash, 'Guest');

    logger.info(`New user registered: ${normalizedUsername}`);

    // Generate JWT token
    const token = jwt.sign(
      { id: result.lastInsertRowid, username: normalizedUsername, role: 'Guest' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      id: result.lastInsertRowid,
      username: normalizedUsername,
      role: 'Guest',
      token,
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Normalize username for case-insensitive login
    const normalizedUsername = username.toLowerCase().trim();

    // Find user (case-insensitive)
    const user = db.prepare(
      'SELECT id, username, password_hash, role FROM users WHERE LOWER(username) = LOWER(?)'
    ).get(normalizedUsername) as { id: number; username: string; password_hash: string; role: string } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User logged in: ${user.username}`);

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token,
    });
  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
