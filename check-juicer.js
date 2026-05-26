const Database = require('better-sqlite3');
const path = require('path');

const defaultPath = process.env.RENDER ? '/data/guild.db' : './data/guild.db';
const dbPath = process.env.DATABASE_PATH || defaultPath;
const db = new Database(dbPath);

console.log(`📁 Using database at: ${dbPath}`);

const members = db.prepare("SELECT name, class, ilvl FROM members WHERE name LIKE '%juicer%' OR name LIKE '%Juicer%'").all();
console.log(JSON.stringify(members, null, 2));

db.close();
