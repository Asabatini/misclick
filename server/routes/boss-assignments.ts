import { Router, Request, Response } from 'express';
import db from '../db/database';
import logger from '../utils/logger';
import { authenticateToken, canEditBossAssignments, AuthRequest } from '../middleware/auth';

const router = Router();

// Get boss assignments for a specific week
router.get('/week/:weekStart', (req: Request, res: Response) => {
  try {
    const assignments = db.prepare(`
      SELECT ba.id, ba.week_start, ba.boss_name, ba.member_id, ba.position, ba.role, ba.created_at,
             m.name, m.class, m.spec
      FROM boss_assignments ba
      JOIN members m ON ba.member_id = m.id
      WHERE ba.week_start = ?
      ORDER BY ba.boss_name, ba.position
    `).all(req.params.weekStart);
    
    // Group by boss name
    const grouped = assignments.reduce((acc: any, assignment: any) => {
      if (!acc[assignment.boss_name]) {
        acc[assignment.boss_name] = [];
      }
      acc[assignment.boss_name].push(assignment);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    logger.error('Error fetching boss assignments', error);
    res.status(500).json({ error: 'Failed to fetch boss assignments' });
  }
});

// Get all assignments (for admin view)
router.get('/', (req: Request, res: Response) => {
  try {
    const assignments = db.prepare(`
      SELECT ba.id, ba.week_start, ba.boss_name, ba.member_id, ba.position, ba.role, ba.created_at,
             m.name, m.class, m.spec
      FROM boss_assignments ba
      JOIN members m ON ba.member_id = m.id
      ORDER BY ba.week_start DESC, ba.boss_name, ba.position
    `).all();
    res.json(assignments);
  } catch (error) {
    logger.error('Error fetching all boss assignments', error);
    res.status(500).json({ error: 'Failed to fetch boss assignments' });
  }
});

// Save boss assignments for a week (bulk operation) - Admin/Officer only
router.post('/week/:weekStart', authenticateToken, canEditBossAssignments, (req: AuthRequest, res: Response) => {
  const { weekStart } = req.params;
  const { assignments } = req.body; // Array of { boss_name, member_id, position, role }

  if (!Array.isArray(assignments)) {
    return res.status(400).json({ error: 'Assignments must be an array' });
  }

  try {
    // Use a transaction to ensure all-or-nothing
    const deleteStmt = db.prepare('DELETE FROM boss_assignments WHERE week_start = ?');
    const insertStmt = db.prepare(
      'INSERT INTO boss_assignments (week_start, boss_name, member_id, position, role) VALUES (?, ?, ?, ?, ?)'
    );

    db.transaction(() => {
      // Clear existing assignments for this week
      deleteStmt.run(weekStart);
      
      // Insert new assignments
      for (const assignment of assignments) {
        insertStmt.run(
          weekStart,
          assignment.boss_name,
          assignment.member_id,
          assignment.position,
          assignment.role || null
        );
      }
    })();

    logger.info(`Saved ${assignments.length} boss assignments for week ${weekStart}`);
    res.json({ message: 'Boss assignments saved successfully', count: assignments.length });
  } catch (error) {
    logger.error('Error saving boss assignments', error);
    res.status(500).json({ error: 'Failed to save boss assignments' });
  }
});

// Clear assignments for a specific boss in a week - Admin/Officer only
router.delete('/week/:weekStart/boss/:bossName', authenticateToken, canEditBossAssignments, (req: AuthRequest, res: Response) => {
  const { weekStart, bossName } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM boss_assignments WHERE week_start = ? AND boss_name = ?');
    const result = stmt.run(weekStart, decodeURIComponent(bossName));
    
    logger.info(`Cleared ${result.changes} assignments for ${bossName} in week ${weekStart}`);
    res.json({ message: 'Boss roster cleared successfully', count: result.changes });
  } catch (error) {
    logger.error('Error clearing boss roster', error);
    res.status(500).json({ error: 'Failed to clear boss roster' });
  }
});

// Update single assignment - Admin/Officer only
router.put('/:id', authenticateToken, canEditBossAssignments, (req: AuthRequest, res: Response) => {
  const { boss_name, member_id, position } = req.body;

  try {
    const stmt = db.prepare(
      'UPDATE boss_assignments SET boss_name = ?, member_id = ?, position = ? WHERE id = ?'
    );
    stmt.run(boss_name, member_id, position, req.params.id);
    
    const updatedAssignment = db.prepare(`
      SELECT ba.*, m.name, m.class, m.spec, m.role
      FROM boss_assignments ba
      JOIN members m ON ba.member_id = m.id
      WHERE ba.id = ?
    `).get(req.params.id);
    res.json(updatedAssignment);
  } catch (error) {
    logger.error('Error updating boss assignment', error);
    res.status(500).json({ error: 'Failed to update boss assignment' });
  }
});

// Delete assignment - Admin/Officer only
router.delete('/:id', authenticateToken, canEditBossAssignments, (req: AuthRequest, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM boss_assignments WHERE id = ?');
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting boss assignment', error);
    res.status(500).json({ error: 'Failed to delete boss assignment' });
  }
});

export default router;
