import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/message_model.dart';
import 'database_service.dart';

class SocketService {
  static IO.Socket? _socket;
  static final Map<String, Function(dynamic)> _listeners = {};

  static String get _serverUrl {
    if (kIsWeb) {
      return 'http://localhost:5000';
    } else {
      // Use local network IP for mobile devices on same WiFi
      return 'http://192.168.100.7:5000';
    }
  }

  static IO.Socket get socket {
    _socket ??= IO.io(_serverUrl, <String, dynamic>{
      'transports': ['polling', 'websocket'],
      'autoConnect': false,
      'forceNew': true,
      'reconnection': true,
      'reconnectionAttempts': 10,
      'reconnectionDelay': 1000,
      'timeout': 20000,
    });
    return _socket!;
  }

  static void connect() {
    if (!socket.connected) {
      socket.connect();
      socket.onConnect((_) {
        print('Connected to Socket.IO server');
      });
      socket.onDisconnect((_) {
        print('Disconnected from Socket.IO server');
      });
      socket.onConnectError((err) {
        print('Connection error: $err');
      });
      socket.onConnectTimeout((_) {
        print('Connection timeout');
      });
      socket.onReconnect((_) {
        print('Reconnected to Socket.IO server');
      });
      socket.onReconnectError((err) {
        print('Reconnection error: $err');
      });
    }
  }

  static void disconnect() {
    socket.disconnect();
    _socket = null;
  }

  static void joinRoom(String userId) {
    socket.emit('join', userId);
  }

  static void sendMessage(String senderId, String receiverId, String message) async {
    final messageData = {
      'senderId': senderId,
      'receiverId': receiverId,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
    };

    // Save outgoing message to local database immediately
    try {
      final messageObj = Message.fromJson(messageData);
      final dbService = DatabaseService();
      await dbService.saveMessage(messageObj);
    } catch (e) {
      print('Error saving outgoing message to database: $e');
    }

    // Also save to backend database via API
    try {
      final response = await http.post(
        Uri.parse('http://localhost:5000/api/messages'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(messageData),
      );
      if (response.statusCode != 200) {
        print('Failed to save message to backend: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saving message to backend: $e');
    }

    socket.emit('private_message', messageData);
  }

  static void sendTyping(String senderId, String receiverId, bool isTyping) {
    socket.emit('typing', {
      'senderId': senderId,
      'receiverId': receiverId,
      'isTyping': isTyping,
    });
  }

  static void onMessageReceived(Function(dynamic) callback) {
    _addListener('private_message', (data) async {
      // Save incoming message to local database
      try {
        final message = Message.fromJson(data);
        final dbService = DatabaseService();
        await dbService.saveMessage(message);
      } catch (e) {
        print('Error saving message to database: $e');
      }
      // Call the original callback
      callback(data);
    });
  }

  static void onMessageSent(Function(dynamic) callback) {
    _addListener('message_sent', callback);
  }

  static void onTypingIndicator(Function(dynamic) callback) {
    _addListener('typing_indicator', callback);
  }

  static void onUserStatusUpdate(Function(dynamic) callback) {
    _addListener('user_status_update', callback);
  }

  static void onNewPost(Function(dynamic) callback) {
    _addListener('new_post', callback);
  }

  static void onNewComment(Function(dynamic) callback) {
    _addListener('new_comment', callback);
  }

  static void _addListener(String event, Function(dynamic) callback) {
    if (_listeners.containsKey(event)) {
      socket.off(event);
    }
    _listeners[event] = callback;
    socket.on(event, callback);
  }

  static void removeListener(String event) {
    if (_listeners.containsKey(event)) {
      socket.off(event);
      _listeners.remove(event);
    }
  }

  static void clearAllListeners() {
    for (final event in _listeners.keys) {
      socket.off(event);
    }
    _listeners.clear();
  }
}
