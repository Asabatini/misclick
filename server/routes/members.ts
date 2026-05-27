import { Router, Request, Response } from 'express';
import db from '../db/database';
import { fetchGuildRoster, fetchCharacterEquipment } from '../services/blizzard';
import logger from '../utils/logger';

const router = Router();

// Get all members
router.get('/', (req: Request, res: Response) => {
  try {
    const members = db.prepare('SELECT * FROM members ORDER BY rank, name').all();
    res.json(members);
  } catch (error) {
    logger.error('Error fetching members', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get single member
router.get('/:id', (req: Request, res: Response) => {
  try {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    logger.error('Error fetching member', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// Create member
router.post('/', (req: Request, res: Response) => {
  const { name, class: className, spec, rank, role, ilvl } = req.body;

  if (!name || !className || !rank || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO members (name, class, spec, rank, role, ilvl) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, className, spec, rank, role, ilvl || null);
    
    const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newMember);
  } catch (error) {
    logger.error('Error creating member', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update member
router.put('/:id', (req: Request, res: Response) => {
  const { name, class: className, spec, rank, role, level, ilvl, raid_status } = req.body;

  try {
    const stmt = db.prepare(
      'UPDATE members SET name = ?, class = ?, spec = ?, rank = ?, role = ?, level = ?, ilvl = ?, raid_status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(name, className, spec, rank, role, level || null, ilvl || null, raid_status || null, req.params.id);
    
    const updatedMember = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    res.json(updatedMember);
  } catch (error) {
    logger.error('Error updating member', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Delete member
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM members WHERE id = ?');
    stmt.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting member', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// Sync roster from Blizzard API
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const rosterData = await fetchGuildRoster();
    
    if (!rosterData.members || rosterData.members.length === 0) {
      return res.status(404).json({ error: 'No members found in roster' });
    }

    // Class ID to Name mapping
    const CLASS_MAP: Record<number, string> = {
      1: 'Warrior', 2: 'Paladin', 3: 'Hunter', 4: 'Rogue', 5: 'Priest',
      6: 'Death Knight', 7: 'Shaman', 8: 'Mage', 9: 'Warlock', 10: 'Monk',
      11: 'Druid', 12: 'Demon Hunter', 13: 'Evoker',
    };

    let synced = 0;
    let updated = 0;
    let inserted = 0;
    
    // Use INSERT OR IGNORE to avoid replacing (which deletes and re-inserts)
    // Then UPDATE existing members to preserve IDs and relationships
    const insertStmt = db.prepare(
      'INSERT OR IGNORE INTO members (name, class, spec, rank, role, level, ilvl, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    const updateStmt = db.prepare(
      'UPDATE members SET class = ?, rank = ?, level = ?, ilvl = ?, last_updated = CURRENT_TIMESTAMP WHERE name = ?'
    );

    // Helper function to delay between API calls
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    logger.info(`Starting roster sync for ${rosterData.members.length} members...`);

    for (const member of rosterData.members) {
      const character = member.character;
      const classId = character.playable_class?.id;
      const className = classId ? CLASS_MAP[classId] || 'Unknown' : 'Unknown';
      const level = character.level || null;
      
      // Fetch item level for this character using their actual realm
      let ilvl = null;
      try {
        const charRealm = character.realm?.slug || 'sargeras';
        ilvl = await fetchCharacterEquipment(charRealm, character.name);
        // Small delay to avoid rate limiting (100ms between calls)
        await delay(100);
      } catch (error) {
        logger.warn(`Could not fetch ilvl for ${character.name}:`, error);
      }
      
      // Try to insert (will be ignored if already exists)
      const insertResult = insertStmt.run(
        character.name,
        className,
        null, // Spec not available in basic roster endpoint
        member.rank?.toString() || '0',
        'DPS', // Default role, can be updated manually
        level, // Character level from roster
        ilvl // Average item level from equipment endpoint
      );
      
      if (insertResult.changes > 0) {
        inserted++;
        logger.info(`  ➕ Inserted new member: ${character.name}`);
      } else {
        // Member exists, update their info
        const updateResult = updateStmt.run(
          className,
          member.rank?.toString() || '0',
          level,
          ilvl,
          character.name
        );
        if (updateResult.changes > 0) {
          updated++;
        }
      }
      
      synced++;
    }

    logger.info(`✅ Roster sync complete: ${synced} total, ${inserted} new, ${updated} updated`);
    res.json({ 
      message: `Successfully synced ${synced} members (${inserted} new, ${updated} updated)`, 
      count: synced,
      inserted,
      updated
    });
  } catch (error) {
    logger.error('Error syncing roster', error);
    res.status(500).json({ error: 'Failed to sync roster from Blizzard API' });
  }
});

export default router;
