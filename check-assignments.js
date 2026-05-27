const Database = require('better-sqlite3');
const path = require('path');

const defaultPath = process.env.RENDER ? '/data/guild.db' : './data/guild.db';
const dbPath = process.env.DATABASE_PATH || defaultPath;

console.log(`📁 Using database at: ${dbPath}\n`);

try {
  const db = new Database(dbPath);
  
  // Check if database file exists and has data
  console.log('=== DATABASE INFO ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`Tables found: ${tables.map(t => t.name).join(', ')}\n`);
  
  // Check boss assignments
  console.log('=== BOSS ASSIGNMENTS ===');
  const assignments = db.prepare(`
    SELECT ba.week_start, ba.boss_name, ba.member_id, ba.role, ba.position, m.name
    FROM boss_assignments ba
    LEFT JOIN members m ON ba.member_id = m.id
    ORDER BY ba.week_start, ba.boss_name, ba.position
  `).all();
  
  if (assignments.length === 0) {
    console.log('❌ No boss assignments found in database\n');
  } else {
    console.log(`✅ Found ${assignments.length} boss assignments:`);
    
    // Group by week_start
    const byWeek = {};
    assignments.forEach(a => {
      if (!byWeek[a.week_start]) {
        byWeek[a.week_start] = [];
      }
      byWeek[a.week_start].push(a);
    });
    
    Object.keys(byWeek).forEach(week => {
      console.log(`\n  Week: ${week} (${byWeek[week].length} assignments)`);
      const bosses = {};
      byWeek[week].forEach(a => {
        if (!bosses[a.boss_name]) {
          bosses[a.boss_name] = [];
        }
        bosses[a.boss_name].push(a);
      });
      
      Object.keys(bosses).forEach(boss => {
        console.log(`    ${boss}: ${bosses[boss].length} members`);
        bosses[boss].forEach(a => {
          console.log(`      - ${a.name || 'Member #' + a.member_id} (${a.role || 'unknown'})`);
        });
      });
    });
  }
  
  // Check users
  console.log('\n=== USERS ===');
  const users = db.prepare('SELECT id, username, role FROM users').all();
  if (users.length === 0) {
    console.log('❌ No users found\n');
  } else {
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`  - ${u.username} (${u.role})`);
    });
  }
  
  // Check members
  console.log('\n=== MEMBERS ===');
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
  console.log(`✅ Found ${memberCount.count} guild members\n`);
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
