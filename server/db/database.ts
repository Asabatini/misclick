import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use persistent disk on Render, local path for development
const defaultPath = process.env.RENDER ? '/data/guild.db' : './data/guild.db';
const dbPath = process.env.DATABASE_PATH || defaultPath;
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`📁 Using database at: ${dbPath}`);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  // Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      class TEXT NOT NULL,
      spec TEXT,
      rank TEXT NOT NULL,
      role TEXT NOT NULL,
      level INTEGER,
      ilvl INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add level column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE members ADD COLUMN level INTEGER`);
  } catch (error) {
    // Column already exists, ignore error
  }
  
  // Add raid_status column if it doesn't exist (for main roster/bench)
  try {
    db.exec(`ALTER TABLE members ADD COLUMN raid_status TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Raid events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS raid_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Absences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // Boss roster assignments table - check if migration is needed
  const tableInfo = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='boss_assignments'`).get() as { sql: string } | undefined;
  
  if (tableInfo) {
    console.log('Existing boss_assignments table found');
    // Check if the constraint already includes role
    const hasRoleInConstraint = tableInfo.sql.includes('UNIQUE(week_start, boss_name, member_id, role)');
    const hasOldConstraint = tableInfo.sql.includes('UNIQUE(week_start, boss_name, member_id)') && !hasRoleInConstraint;
    
    if (hasOldConstraint) {
      // Old constraint exists, need to migrate to include role in unique constraint
      console.log('Migrating boss_assignments table to include role in unique constraint...');
      
      db.exec(`
        -- Create new table with correct constraint
        CREATE TABLE boss_assignments_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_start DATE NOT NULL,
          boss_name TEXT NOT NULL,
          member_id INTEGER NOT NULL,
          position INTEGER NOT NULL,
          role TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
          UNIQUE(week_start, boss_name, member_id, role)
        );
        
        -- Copy data from old table (set default role for existing records)
        INSERT INTO boss_assignments_new (id, week_start, boss_name, member_id, position, role, created_at)
        SELECT id, week_start, boss_name, member_id, position, 
               COALESCE(role, 'dps') as role, 
               created_at 
        FROM boss_assignments;
        
        -- Drop old table
        DROP TABLE boss_assignments;
        
        -- Rename new table
        ALTER TABLE boss_assignments_new RENAME TO boss_assignments;
      `);
      
      console.log('Migration completed successfully');
    } else if (hasRoleInConstraint) {
      console.log('boss_assignments table already has correct constraint');
    }
  } else {
    // Table doesn't exist, create it with correct constraint
    console.log('Creating boss_assignments table with role constraint');
    db.exec(`
      CREATE TABLE boss_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start DATE NOT NULL,
        boss_name TEXT NOT NULL,
        member_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(week_start, boss_name, member_id, role)
      )
    `);
  }
  
  // Add role column if it doesn't exist (for tables created before role was added)
  try {
    db.exec(`ALTER TABLE boss_assignments ADD COLUMN role TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Migrate old weekly rosters to single 'current' roster
  const oldAssignments = db.prepare(`
    SELECT COUNT(*) as count FROM boss_assignments WHERE week_start != 'current'
  `).get() as { count: number };
  
  if (oldAssignments.count > 0) {
    console.log(`🔄 Migrating ${oldAssignments.count} old weekly assignments to 'current' roster...`);
    
    // Get the most recent week's assignments
    const mostRecentWeek = db.prepare(`
      SELECT week_start FROM boss_assignments 
      WHERE week_start != 'current'
      ORDER BY week_start DESC 
      LIMIT 1
    `).get() as { week_start: string } | undefined;
    
    if (mostRecentWeek) {
      console.log(`   Using assignments from week: ${mostRecentWeek.week_start}`);
      
      db.transaction(() => {
        // Delete any existing 'current' assignments
        db.prepare(`DELETE FROM boss_assignments WHERE week_start = 'current'`).run();
        
        // Copy most recent week to 'current'
        db.prepare(`
          INSERT INTO boss_assignments (week_start, boss_name, member_id, position, role, created_at)
          SELECT 'current', boss_name, member_id, position, role, created_at
          FROM boss_assignments
          WHERE week_start = ?
        `).run(mostRecentWeek.week_start);
        
        // Delete all old weekly assignments
        db.prepare(`DELETE FROM boss_assignments WHERE week_start != 'current'`).run();
      })();
      
      const currentCount = db.prepare(`
        SELECT COUNT(*) as count FROM boss_assignments WHERE week_start = 'current'
      `).get() as { count: number };
      
      console.log(`   ✅ Migrated ${currentCount.count} assignments to 'current' roster`);
    }
  }

  // Fight preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fight_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      boss_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE(member_id, boss_name)
    )
  `);

  // Boss kills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS boss_kills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_name TEXT NOT NULL,
      kill_date DATE,
      difficulty TEXT DEFAULT 'mythic',
      raid_tier TEXT DEFAULT 'midnight-s1',
      best_pull_percent INTEGER,
      screenshot_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(boss_name, difficulty, raid_tier)
    )
  `);
  
  // Add new columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE boss_kills ADD COLUMN difficulty TEXT DEFAULT 'mythic'`);
  } catch (error) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE boss_kills ADD COLUMN raid_tier TEXT DEFAULT 'midnight-s1'`);
  } catch (error) {
    // Column already exists
  }

  // Users table for authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Guest',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK(role IN ('Administrator', 'Officer', 'Raider', 'Member', 'Guest'))
    )
  `);

  console.log('✅ Database initialized successfully');
  
  // Log current state for diagnostics
  const stats = {
    members: db.prepare('SELECT COUNT(*) as count FROM members').get() as { count: number },
    assignments: db.prepare('SELECT COUNT(*) as count FROM boss_assignments').get() as { count: number },
    preferences: db.prepare('SELECT COUNT(*) as count FROM fight_preferences').get() as { count: number },
    users: db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
    bossKills: db.prepare('SELECT COUNT(*) as count FROM boss_kills').get() as { count: number },
  };
  
  console.log(`📊 Database stats:`, {
    members: stats.members.count,
    assignments: stats.assignments.count,
    preferences: stats.preferences.count,
    users: stats.users.count,
    bossKills: stats.bossKills.count,
  });
  
  if (stats.assignments.count > 0) {
    const assignmentsByWeek = db.prepare(`
      SELECT week_start, COUNT(*) as count 
      FROM boss_assignments 
      GROUP BY week_start
    `).all() as Array<{ week_start: string; count: number }>;
    
    console.log('   Boss assignments by roster:');
    assignmentsByWeek.forEach(row => {
      console.log(`   - ${row.week_start}: ${row.count} assignments`);
    });
  }
  
  if (stats.preferences.count > 0) {
    const preferencesByBoss = db.prepare(`
      SELECT boss_name, COUNT(*) as count 
      FROM fight_preferences 
      GROUP BY boss_name
    `).all() as Array<{ boss_name: string; count: number }>;
    
    console.log('   Fight preferences by boss:');
    preferencesByBoss.forEach(row => {
      console.log(`   - ${row.boss_name}: ${row.count} preferences`);
    });
  }
}

export default db;
