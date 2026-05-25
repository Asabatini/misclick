const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'guild.db');
const db = new Database(dbPath);
const SALT_ROUNDS = 10;

console.log('🔧 Setting up production admin account...\n');

(async () => {
  try {
    // Hash the new password
    const newPassword = 'P@55word87';
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update Juice to Administrator with new password
    const updateResult = db.prepare(
      'UPDATE users SET role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
    ).run('Administrator', passwordHash, 'juice');
    
    if (updateResult.changes > 0) {
      console.log('✅ Updated Juice to Administrator with new password');
    } else {
      console.log('⚠️  Juice account not found');
    }
    
    // Delete the admin account
    const deleteResult = db.prepare('DELETE FROM users WHERE username = ?').run('admin');
    
    if (deleteResult.changes > 0) {
      console.log('✅ Deleted admin account');
    } else {
      console.log('ℹ️  Admin account not found (may already be deleted)');
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
