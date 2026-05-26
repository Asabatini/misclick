const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Use the same database path logic as database.ts
const defaultPath = process.env.RENDER ? '/data/guild.db' : path.join(__dirname, 'data', 'guild.db');
const dbPath = process.env.DATABASE_PATH || defaultPath;
const db = new Database(dbPath);
const SALT_ROUNDS = 10;

console.log(`📁 Using database at: ${dbPath}`);

console.log('🔧 Setting up production admin account...\n');

(async () => {
  try {
    // Hash the new password
    const newPassword = 'P@55word87';
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Check if juice user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('juice');
    
    if (existingUser) {
      // Update existing juice user to Administrator with new password
      db.prepare(
        'UPDATE users SET role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
      ).run('Administrator', passwordHash, 'juice');
      console.log('✅ Updated Juice to Administrator with new password');
    } else {
      // Create new juice user as Administrator
      db.prepare(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
      ).run('juice', passwordHash, 'Administrator');
      console.log('✅ Created Juice as Administrator with password');
    }
    
    // Delete the admin account if it exists
    const deleteResult = db.prepare('DELETE FROM users WHERE username = ?').run('admin');
    
    if (deleteResult.changes > 0) {
      console.log('✅ Deleted admin account');
    }
    
    console.log('\n📋 Current users:');
    const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
    console.table(users);
    
    console.log('\n✅ Production admin setup complete!');
    console.log('   Username: juice');
    console.log('   Password: P@55word87');
    console.log('   Role: Administrator\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
})();
