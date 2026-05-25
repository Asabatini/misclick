import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/database';
import logger from '../utils/logger';
import { authenticateToken, canManageUsers, AuthRequest } from '../middleware/auth';

const router = express.Router();
const SALT_ROUNDS = 10;

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(canManageUsers);

// Get all users
router.get('/', (req: AuthRequest, res) => {
  try {
    const users = db.prepare(
      'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    ).all();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', (req: AuthRequest, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?'
    ).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role
router.put('/:id/role', (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const userId = parseInt(req.params.id);

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const validRoles = ['Administrator', 'Officer', 'Raider', 'Member', 'Guest'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent user from changing their own role
    if (req.user && req.user.id === userId) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const result = db.prepare(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(role, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User role updated: ID ${userId} -> ${role} by ${req.user?.username}`);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Reset user password
router.put('/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;
    const userId = parseInt(req.params.id);

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(passwordHash, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Password reset for user ID ${userId} by ${req.user?.username}`);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user
router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent user from deleting themselves
    if (req.user && req.user.id === userId) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User deleted: ID ${userId} by ${req.user?.username}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
