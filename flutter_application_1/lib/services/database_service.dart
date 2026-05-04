import 'dart:async';
import 'dart:io';
import 'package:sqflite/sqflite.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:path/path.dart';
import 'package:flutter/foundation.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';

class DatabaseService {
  static Database? _database;

  // Get database instance
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  // Initialize database
  Future<Database> _initDatabase() async {
    // Initialize FFI for web/desktop platforms
    if (kIsWeb || (!Platform.isAndroid && !Platform.isIOS)) {
      sqfliteFfiInit();
      databaseFactory = databaseFactoryFfi;
    }

    String path = join(await getDatabasesPath(), 'superior_messenger.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  // Create tables
  Future<void> _onCreate(Database db, int version) async {
    // Users table
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        profilePicture TEXT,
        isOnline INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    ''');

    // Messages table
    await db.execute('''
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        isRead INTEGER DEFAULT 0,
        FOREIGN KEY (senderId) REFERENCES users (id),
        FOREIGN KEY (receiverId) REFERENCES users (id)
      )
    ''');

    // Insert predefined users
    await _insertPredefinedUsers(db);
  }

  // Insert predefined users
  Future<void> _insertPredefinedUsers(Database db) async {
    final users = [
      {
        'id': 'faseeh',
        'name': 'Faseeh',
        'email': 'faseeh@superior.edu.pk',
        'profilePicture': 'https://ui-avatars.com/api/?name=Faseeh&background=6366f1&color=fff',
      },
      {
        'id': 'tabrez',
        'name': 'Tabrez',
        'email': 'tabrez@superior.edu.pk',
        'profilePicture': 'https://ui-avatars.com/api/?name=Tabrez&background=6366f1&color=fff',
      },
      {
        'id': 'zain',
        'name': 'Zain',
        'email': 'zain@superior.edu.pk',
        'profilePicture': 'https://ui-avatars.com/api/?name=Zain&background=6366f1&color=fff',
      },
      {
        'id': 'adnan',
        'name': 'Adnan',
        'email': 'adnan@superior.edu.pk',
        'profilePicture': 'https://ui-avatars.com/api/?name=Adnan&background=6366f1&color=fff',
      },
      {
        'id': 'muskan',
        'name': 'Muskan',
        'email': 'muskan@superior.edu.pk',
        'profilePicture': 'https://ui-avatars.com/api/?name=Muskan&background=6366f1&color=fff',
      },
    ];

    for (var user in users) {
      await db.insert('users', user, conflictAlgorithm: ConflictAlgorithm.ignore);
    }
  }

  // User operations
  Future<User?> getUserById(String userId) async {
    final db = await database;
    final maps = await db.query(
      'users',
      where: 'id = ?',
      whereArgs: [userId],
    );

    if (maps.isNotEmpty) {
      return User.fromMap(maps.first);
    }
    return null;
  }

  Future<List<User>> getAllUsers() async {
    final db = await database;
    final maps = await db.query('users');
    return maps.map((map) => User.fromMap(map)).toList();
  }

  Future<void> updateUserOnlineStatus(String userId, bool isOnline) async {
    final db = await database;
    await db.update(
      'users',
      {'isOnline': isOnline ? 1 : 0},
      where: 'id = ?',
      whereArgs: [userId],
    );
  }

  // Message operations
  Future<void> saveMessage(Message message) async {
    final db = await database;
    await db.insert(
      'messages',
      message.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Message>> getMessagesBetweenUsers(String userId1, String userId2) async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT * FROM messages
      WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
      ORDER BY timestamp ASC
    ''', [userId1, userId2, userId2, userId1]);

    return maps.map((map) => Message.fromMap(map)).toList();
  }

  Future<void> markMessagesAsRead(String senderId, String receiverId) async {
    final db = await database;
    await db.update(
      'messages',
      {'isRead': 1},
      where: 'senderId = ? AND receiverId = ? AND isRead = 0',
      whereArgs: [senderId, receiverId],
    );
  }

  // Sync operations for offline support
  Future<void> syncMessagesFromServer(List<Message> messages) async {
    final db = await database;
    await db.transaction((txn) async {
      for (var message in messages) {
        await txn.insert(
          'messages',
          message.toMap(),
          conflictAlgorithm: ConflictAlgorithm.ignore,
        );
      }
    });
  }

  // Get unsynced messages (for future sync implementation)
  Future<List<Message>> getUnsyncedMessages() async {
    // This would be used if we implement offline message sending
    return [];
  }

  // Clear all data (for testing or reset)
  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('messages');
    await db.delete('users');
    await _insertPredefinedUsers(db);
  }
}
