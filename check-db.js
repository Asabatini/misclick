const Database = require('better-sqlite3');
const db = new Database('./data/guild.db');

const members = db.prepare('SELECT name, class, rank, ilvl FROM members LIMIT 10').all();
console.log(JSON.stringify(members, null, 2));

db.close();
