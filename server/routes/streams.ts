import express from 'express';
import db from '../db/database';
import logger from '../utils/logger';

const router = express.Router();

// Get all streams
router.get('/', (req, res) => {
  try {
    const streams = db.prepare('SELECT * FROM streams ORDER BY created_at DESC').all();
    res.json(streams);
  } catch (error) {
    logger.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get active streams only
router.get('/active', (req, res) => {
  try {
    const streams = db.prepare('SELECT * FROM streams WHERE is_active = 1 ORDER BY created_at DESC').all();
    res.json(streams);
  } catch (error) {
    logger.error('Error fetching active streams:', error);
    res.status(500).json({ error: 'Failed to fetch active streams' });
  }
});

// Create a new stream
router.post('/', (req, res) => {
  try {
    const { platform, username, display_name } = req.body;
    
    if (!platform || !username || !display_name) {
      return res.status(400).json({ error: 'platform, username, and display_name are required' });
    }

    if (!['twitch', 'youtube'].includes(platform.toLowerCase())) {
      return res.status(400).json({ error: 'platform must be either "twitch" or "youtube"' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO streams (platform, username, display_name, is_active)
      VALUES (?, ?, ?, 1)
    `);
    
    const result = stmt.run(platform.toLowerCase(), username, display_name);
    
    const newStream = db.prepare('SELECT * FROM streams WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newStream);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Stream already exists' });
    }
    logger.error('Error creating stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Update a stream
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { platform, username, display_name, is_active } = req.body;
    
    const stmt = db.prepare(`
      UPDATE streams 
      SET platform = ?, username = ?, display_name = ?, is_active = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      platform?.toLowerCase() || 'twitch', 
      username, 
      display_name, 
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    const updatedStream = db.prepare('SELECT * FROM streams WHERE id = ?').get(id);
    res.json(updatedStream);
  } catch (error) {
    logger.error('Error updating stream:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Delete a stream
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM streams WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    logger.error('Error deleting stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

export default router;
