const Database = require('better-sqlite3');
const path = require('path');

const defaultPath = process.env.RENDER ? '/data/guild.db' : path.join(__dirname, 'data', 'guild.db');
const dbPath = process.env.DATABASE_PATH || defaultPath;
const db = new Database(dbPath);

console.log(`📁 Using database at: ${dbPath}`);
console.log('🔄 Normalizing usernames to lowercase...\n');

try {
  // Get all users
  const users = db.prepare('SELECT id, username FROM users').all();
  
  console.log(`Found ${users.length} user(s) to check:\n`);
  
  let updated = 0;
  for (const user of users) {
    const normalized = user.username.toLowerCase().trim();
    
    if (user.username !== normalized) {
      console.log(`  Updating: "${user.username}" → "${normalized}"`);
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(normalized, user.id);
      updated++;
    } else {
      console.log(`  ✓ Already normalized: "${user.username}"`);
    }
  }
  
  console.log(`\n✅ Migration complete! Updated ${updated} username(s).\n`);
  
  // Show final state
  const finalUsers = db.prepare('SELECT id, username, role FROM users').all();
  console.log('Current users:');
  console.table(finalUsers);
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
