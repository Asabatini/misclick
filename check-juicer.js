const Database = require('better-sqlite3');
const db = new Database('./data/guild.db');

const members = db.prepare("SELECT name, class, ilvl FROM members WHERE name LIKE '%juicer%' OR name LIKE '%Juicer%'").all();
console.log(JSON.stringify(members, null, 2));

db.close();
