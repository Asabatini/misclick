const Database = require('better-sqlite3');
const path = require('path');

const defaultPath = process.env.RENDER ? '/data/guild.db' : './data/guild.db';
const dbPath = process.env.DATABASE_PATH || defaultPath;
const db = new Database(dbPath);

console.log(`📁 Using database at: ${dbPath}`);

const members = db.prepare('SELECT name, class, rank, ilvl FROM members LIMIT 10').all();
console.log(JSON.stringify(members, null, 2));

db.close();
