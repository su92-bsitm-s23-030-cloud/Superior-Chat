const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'superior_messenger.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        profile_picture TEXT,
        is_online INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating messages table:', err.message);
      } else {
        // Insert predefined users if they don't exist
        const predefinedUsers = [
          { id: 'faseeh', name: 'Faseeh', email: 'faseeh@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Faseeh&background=6366f1&color=fff' },
          { id: 'tabrez', name: 'Tabrez', email: 'tabrez@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Tabrez&background=6366f1&color=fff' },
          { id: 'zain', name: 'Zain', email: 'zain@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Zain&background=6366f1&color=fff' },
          { id: 'adnan', name: 'Adnan', email: 'adnan@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Adnan&background=6366f1&color=fff' },
          { id: 'muskan', name: 'Muskan', email: 'muskan@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Muskan&background=6366f1&color=fff' }
        ];

        predefinedUsers.forEach(user => {
          db.run(`
            INSERT OR IGNORE INTO users (id, name, email, profile_picture)
            VALUES (?, ?, ?, ?)
          `, [user.id, user.name, user.email, user.profile_picture]);
        });

        console.log('Database initialized with predefined users.');
      }
    });
  });
}

// Database operations
const databaseOperations = {
  // User operations
  getUserById: (userId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updateUserOnlineStatus: (userId, isOnline) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET is_online = ? WHERE id = ?', [isOnline ? 1 : 0, userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({ ...row, is_online: row.is_online === 1 })));
      });
    });
  },

  // Message operations
  saveMessage: (messageData) => {
    return new Promise((resolve, reject) => {
      const { id, senderId, receiverId, message, timestamp, isRead } = messageData;
      db.run(`
        INSERT INTO messages (id, sender_id, receiver_id, message, timestamp, is_read)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, senderId, receiverId, message, timestamp, isRead ? 1 : 0], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  getMessagesBetweenUsers: (userId1, userId2) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC
      `, [userId1, userId2, userId2, userId1], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          isRead: row.is_read === 1,
          timestamp: new Date(row.timestamp)
        })));
      });
    });
  },

  markMessagesAsRead: (senderId, receiverId) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE messages SET is_read = 1
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `, [senderId, receiverId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
};

module.exports = { db, databaseOperations };
