const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'superior_messenger.db'));

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Tables:', rows);
    if (rows.length > 0) {
      db.all("SELECT * FROM messages", (err2, msgRows) => {
        if (err2) {
          console.error('Messages error:', err2);
        } else {
          console.log('Messages in DB:', msgRows.length);
        }
        db.close();
      });
    } else {
      db.close();
    }
  }
});
