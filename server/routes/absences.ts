import { Router, Request, Response } from 'express';
import db from '../db/database';
import logger from '../utils/logger';

const router = Router();

// Get all absences
router.get('/', (req: Request, res: Response) => {
  try {
    const absences = db.prepare(`
      SELECT a.*, m.name as member_name, m.class, m.rank
      FROM absences a
      JOIN members m ON a.member_id = m.id
      ORDER BY a.start_date
    `).all();
    res.json(absences);
  } catch (error) {
    logger.error('Error fetching absences', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

// Get absences for a specific member
router.get('/member/:memberId', (req: Request, res: Response) => {
  try {
    const absences = db.prepare(`
      SELECT * FROM absences 
      WHERE member_id = ? 
      ORDER BY start_date
    `).all(req.params.memberId);
    res.json(absences);
  } catch (error) {
    logger.error('Error fetching member absences', error);
    res.status(500).json({ error: 'Failed to fetch member absences' });
  }
});

// Get absences in date range
router.get('/range', (req: Request, res: Response) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  try {
    const absences = db.prepare(`
      SELECT a.*, m.name as member_name, m.class, m.rank
      FROM absences a
      JOIN members m ON a.member_id = m.id
      WHERE a.start_date <= ? AND a.end_date >= ?
      ORDER BY a.start_date
    `).all(end, start);
    res.json(absences);
  } catch (error) {
    logger.error('Error fetching absences in range', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

// Create absence
router.post('/', (req: Request, res: Response) => {
  const { member_id, start_date, end_date, reason } = req.body;

  if (!member_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO absences (member_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(member_id, start_date, end_date, reason || null);
    
    const newAbsence = db.prepare(`
      SELECT a.*, m.name as member_name, m.class, m.rank
      FROM absences a
      JOIN members m ON a.member_id = m.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(newAbsence);
  } catch (error) {
    logger.error('Error creating absence', error);
    res.status(500).json({ error: 'Failed to create absence' });
  }
});

// Update absence
router.put('/:id', (req: Request, res: Response) => {
  const { member_id, start_date, end_date, reason } = req.body;

  try {
    const stmt = db.prepare(
      'UPDATE absences SET member_id = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ?'
    );
    stmt.run(member_id, start_date, end_date, reason || null, req.params.id);
    
    const updatedAbsence = db.prepare(`
      SELECT a.*, m.name as member_name, m.class, m.rank
      FROM absences a
      JOIN members m ON a.member_id = m.id
      WHERE a.id = ?
    `).get(req.params.id);
    res.json(updatedAbsence);
  } catch (error) {
    logger.error('Error updating absence', error);
    res.status(500).json({ error: 'Failed to update absence' });
  }
});

// Delete absence
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM absences WHERE id = ?');
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting absence', error);
    res.status(500).json({ error: 'Failed to delete absence' });
  }
});

export default router;
