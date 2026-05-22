import { Router, Request, Response } from 'express';
import db from '../db/database';
import logger from '../utils/logger';

const router = Router();

// Get all fight preferences
router.get('/', (req: Request, res: Response) => {
  try {
    const preferences = db.prepare(`
      SELECT fp.*, m.name, m.class, m.spec, m.role
      FROM fight_preferences fp
      JOIN members m ON fp.member_id = m.id
      ORDER BY fp.boss_name, fp.priority, fp.created_at
    `).all();
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching fight preferences', error);
    res.status(500).json({ error: 'Failed to fetch fight preferences' });
  }
});

// Get preferences for a specific member
router.get('/member/:memberId', (req: Request, res: Response) => {
  try {
    const preferences = db.prepare(`
      SELECT * FROM fight_preferences 
      WHERE member_id = ? 
      ORDER BY boss_name
    `).all(req.params.memberId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching member preferences', error);
    res.status(500).json({ error: 'Failed to fetch member preferences' });
  }
});

// Get preferences for a specific boss
router.get('/boss/:bossName', (req: Request, res: Response) => {
  try {
    const preferences = db.prepare(`
      SELECT fp.*, m.name, m.class, m.spec, m.role
      FROM fight_preferences fp
      JOIN members m ON fp.member_id = m.id
      WHERE fp.boss_name = ?
      ORDER BY fp.priority, fp.created_at
    `).all(req.params.bossName);
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching boss preferences', error);
    res.status(500).json({ error: 'Failed to fetch boss preferences' });
  }
});

// Create fight preference
router.post('/', (req: Request, res: Response) => {
  const { member_id, boss_name, reason, priority } = req.body;

  if (!member_id || !boss_name || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO fight_preferences (member_id, boss_name, reason, priority) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(member_id, boss_name, reason, priority || 'normal');
    
    const newPreference = db.prepare(`
      SELECT fp.*, m.name, m.class, m.spec, m.role
      FROM fight_preferences fp
      JOIN members m ON fp.member_id = m.id
      WHERE fp.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(newPreference);
  } catch (error) {
    logger.error('Error creating fight preference', error);
    res.status(500).json({ error: 'Failed to create fight preference' });
  }
});

// Update fight preference
router.put('/:id', (req: Request, res: Response) => {
  const { boss_name, reason, priority } = req.body;

  try {
    const stmt = db.prepare(
      'UPDATE fight_preferences SET boss_name = ?, reason = ?, priority = ? WHERE id = ?'
    );
    stmt.run(boss_name, reason, priority || 'normal', req.params.id);
    
    const updatedPreference = db.prepare(`
      SELECT fp.*, m.name, m.class, m.spec, m.role
      FROM fight_preferences fp
      JOIN members m ON fp.member_id = m.id
      WHERE fp.id = ?
    `).get(req.params.id);
    res.json(updatedPreference);
  } catch (error) {
    logger.error('Error updating fight preference', error);
    res.status(500).json({ error: 'Failed to update fight preference' });
  }
});

// Delete fight preference
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM fight_preferences WHERE id = ?');
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting fight preference', error);
    res.status(500).json({ error: 'Failed to delete fight preference' });
  }
});

export default router;
