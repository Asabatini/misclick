import { Router, Request, Response } from 'express';
import db from '../db/database';
import logger from '../utils/logger';

const router = Router();

// Get all raid events
router.get('/', (req: Request, res: Response) => {
  try {
    const events = db.prepare('SELECT * FROM raid_events ORDER BY start_date').all();
    res.json(events);
  } catch (error) {
    logger.error('Error fetching raid events', error);
    res.status(500).json({ error: 'Failed to fetch raid events' });
  }
});

// Get events in date range
router.get('/range', (req: Request, res: Response) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  try {
    const events = db.prepare(
      'SELECT * FROM raid_events WHERE start_date >= ? AND end_date <= ? ORDER BY start_date'
    ).all(start, end);
    res.json(events);
  } catch (error) {
    logger.error('Error fetching raid events in range', error);
    res.status(500).json({ error: 'Failed to fetch raid events' });
  }
});

// Create raid event
router.post('/', (req: Request, res: Response) => {
  const { title, start_date, end_date, description } = req.body;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO raid_events (title, start_date, end_date, description) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(title, start_date, end_date, description || null);
    
    const newEvent = db.prepare('SELECT * FROM raid_events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEvent);
  } catch (error) {
    logger.error('Error creating raid event', error);
    res.status(500).json({ error: 'Failed to create raid event' });
  }
});

// Update raid event
router.put('/:id', (req: Request, res: Response) => {
  const { title, start_date, end_date, description } = req.body;

  try {
    const stmt = db.prepare(
      'UPDATE raid_events SET title = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?'
    );
    stmt.run(title, start_date, end_date, description || null, req.params.id);
    
    const updatedEvent = db.prepare('SELECT * FROM raid_events WHERE id = ?').get(req.params.id);
    res.json(updatedEvent);
  } catch (error) {
    logger.error('Error updating raid event', error);
    res.status(500).json({ error: 'Failed to update raid event' });
  }
});

// Delete raid event
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM raid_events WHERE id = ?');
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting raid event', error);
    res.status(500).json({ error: 'Failed to delete raid event' });
  }
});

export default router;
