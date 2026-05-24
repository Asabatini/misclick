import express from 'express';
import db from '../db/database';
import logger from '../utils/logger';

const router = express.Router();

// Get all boss kills
router.get('/', (req, res) => {
  try {
    const kills = db.prepare('SELECT * FROM boss_kills ORDER BY kill_date DESC').all();
    res.json(kills);
  } catch (error) {
    logger.error('Error fetching boss kills:', error);
    res.status(500).json({ error: 'Failed to fetch boss kills' });
  }
});

// Get a specific boss kill
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const kill = db.prepare('SELECT * FROM boss_kills WHERE id = ?').get(id);
    
    if (!kill) {
      return res.status(404).json({ error: 'Boss kill not found' });
    }
    
    res.json(kill);
  } catch (error) {
    logger.error('Error fetching boss kill:', error);
    res.status(500).json({ error: 'Failed to fetch boss kill' });
  }
});

// Create a new boss kill
router.post('/', (req, res) => {
  try {
    const { boss_name, kill_date, screenshot_url } = req.body;
    
    if (!boss_name || !kill_date) {
      return res.status(400).json({ error: 'boss_name and kill_date are required' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO boss_kills (boss_name, kill_date, screenshot_url)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(boss_name, kill_date, screenshot_url || null);
    
    const newKill = db.prepare('SELECT * FROM boss_kills WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newKill);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Boss kill already recorded' });
    }
    logger.error('Error creating boss kill:', error);
    res.status(500).json({ error: 'Failed to create boss kill' });
  }
});

// Update a boss kill
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { boss_name, kill_date, screenshot_url } = req.body;
    
    const stmt = db.prepare(`
      UPDATE boss_kills 
      SET boss_name = ?, kill_date = ?, screenshot_url = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(boss_name, kill_date, screenshot_url || null, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Boss kill not found' });
    }
    
    const updatedKill = db.prepare('SELECT * FROM boss_kills WHERE id = ?').get(id);
    res.json(updatedKill);
  } catch (error) {
    logger.error('Error updating boss kill:', error);
    res.status(500).json({ error: 'Failed to update boss kill' });
  }
});

// Delete a boss kill
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM boss_kills WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Boss kill not found' });
    }
    
    res.json({ message: 'Boss kill deleted successfully' });
  } catch (error) {
    logger.error('Error deleting boss kill:', error);
    res.status(500).json({ error: 'Failed to delete boss kill' });
  }
});

export default router;
