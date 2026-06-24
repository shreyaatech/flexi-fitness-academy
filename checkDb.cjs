const Database = require('better-sqlite3');
try {
  const db = new Database('academy.db');
  console.log("Tables:");
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(tables);

  const test = db.prepare("SELECT * FROM global_media LIMIT 1").get();
  console.log("Global Media:", test);
} catch (e) {
  console.error("Error:", e.message);
}
