const Database = require('better-sqlite3');

const db = new Database('./data/guild.db');

// Update admin user to Administrator
const result = db.prepare('UPDATE users SET role = ? WHERE username = ?').run('Administrator', 'admin');

console.log(`Updated ${result.changes} user(s)`);

// Show all users
const users = db.prepare('SELECT id, username, role FROM users').all();
console.log('\nAll users:');
console.table(users);

db.close();
