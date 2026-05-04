const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'superior_messenger.db');

// Create database connection
let db;

function createDatabaseConnection() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database.');
      initializeDatabase();
    }
  });
}

createDatabaseConnection();

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
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table created or already exists.');
      }
    });

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
        console.log('Messages table created or already exists.');
      }
    });

    // Posts table
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating posts table:', err.message);
      } else {
        console.log('Posts table created or already exists.');
      }
    });

    // Comments table
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating comments table:', err.message);
      } else {
        console.log('Comments table created or already exists.');
        // Insert predefined users after all tables are created
        insertPredefinedUsers();
      }
    });
  });
}

function insertPredefinedUsers() {
  const predefinedUsers = [
    { id: 'faseeh', name: 'Faseeh', email: 'faseeh@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Faseeh&background=6366f1&color=fff' },
    { id: 'tabrez', name: 'Tabrez', email: 'tabrez@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Tabrez&background=6366f1&color=fff' },
    { id: 'zain', name: 'Zain', email: 'zain@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Zain&background=6366f1&color=fff' },
    { id: 'adnan', name: 'Adnan', email: 'adnan@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Adnan&background=6366f1&color=fff' },
    { id: 'muskan', name: 'Muskan', email: 'muskan@superior.edu.pk', profile_picture: 'https://ui-avatars.com/api/?name=Muskan&background=6366f1&color=fff' }
  ];

  let completed = 0;
  predefinedUsers.forEach(user => {
    db.run(`
      INSERT OR IGNORE INTO users (id, name, email, profile_picture)
      VALUES (?, ?, ?, ?)
    `, [user.id, user.name, user.email, user.profile_picture], (err) => {
      if (err) {
        console.error('Error inserting user:', err.message);
      }
      completed++;
      if (completed === predefinedUsers.length) {
        console.log('Database initialized with predefined users.');
        // Keep database open for server operations
        console.log('Database ready for server operations.');
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

  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { id, name, email, profile_picture, is_online, created_at } = userData;
      db.run(`
        INSERT INTO users (id, name, email, profile_picture, is_online, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, name, email, profile_picture, is_online ? 1 : 0, created_at], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
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
  },

  // Post operations
  savePost: (postData) => {
    return new Promise((resolve, reject) => {
      const { id, userId, content, timestamp } = postData;
      db.run(`
        INSERT INTO posts (id, user_id, content, timestamp)
        VALUES (?, ?, ?, ?)
      `, [id, userId, content, timestamp], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  getAllPosts: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT posts.*, users.name, users.profile_picture
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.timestamp DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Comment operations
  saveComment: (commentData) => {
    return new Promise((resolve, reject) => {
      const { id, postId, userId, content, timestamp } = commentData;
      db.run(`
        INSERT INTO comments (id, post_id, user_id, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `, [id, postId, userId, content, timestamp], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  getCommentsForPost: (postId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT comments.*, users.name, users.profile_picture
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.timestamp ASC
      `, [postId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, databaseOperations };
