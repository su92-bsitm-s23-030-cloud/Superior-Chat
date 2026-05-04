import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/message_model.dart';
import '../models/post_model.dart';
import '../models/comment_model.dart';
import 'database_service.dart';
class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    } else {
      // Use local network IP for mobile devices on same WiFi
      return 'http://192.168.100.7:5000/api';
    }
  }

  static Future<Map<String, dynamic>> login(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Login failed'
        };
      }
    } catch (e) {
      print('Login API Error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.'
      };
    }
  }

  static Future<Map<String, dynamic>> register(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Registration failed'
        };
      }
    } catch (e) {
      print('Registration API Error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.'
      };
    }
  }

  static Future<Map<String, dynamic>> googleLogin(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google-login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Google login failed'
        };
      }
    } catch (e) {
      print('Google Login API Error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.'
      };
    }
  }

  static Future<List<dynamic>> getUsers() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/users'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['users'];
      } else {
        throw Exception('Failed to load users');
      }
    } catch (e) {
      print('API Error: $e');
      return [];
    }
  }

  static Future<List<Message>> getMessages(String userId, String otherUserId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/messages/$userId/$otherUserId'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final messages = (data['messages'] as List)
            .map((msg) => Message.fromJson(msg))
            .toList();

        // Sync messages to local database
        final dbService = DatabaseService();
        await dbService.syncMessagesFromServer(messages);

        return messages;
      } else {
        // Fallback to local database if API fails
        final dbService = DatabaseService();
        return await dbService.getMessagesBetweenUsers(userId, otherUserId);
      }
    } catch (e) {
      print('Messages API Error: $e');
      // Fallback to local database
      try {
        final dbService = DatabaseService();
        return await dbService.getMessagesBetweenUsers(userId, otherUserId);
      } catch (dbError) {
        print('Database fallback error: $dbError');
        return [];
      }
    }
  }

  static Future<bool> isBackendRunning() async {
    try {
      final response = await http.get(Uri.parse(kIsWeb ? 'http://localhost:5000/' : 'http://192.168.100.7:5000/'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Posts API methods
  static Future<Map<String, dynamic>> createPost(String userId, String content) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'content': content
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Failed to create post'
        };
      }
    } catch (e) {
      print('Create Post API Error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.'
      };
    }
  }

  static Future<List<Post>> getPosts() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/posts'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final posts = (data['posts'] as List)
            .map((post) => Post.fromJson(post))
            .toList();
        return posts;
      } else {
        throw Exception('Failed to load posts');
      }
    } catch (e) {
      print('Get Posts API Error: $e');
      return [];
    }
  }

  // Comments API methods
  static Future<Map<String, dynamic>> createComment(String postId, String userId, String content) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/comments'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'content': content
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Failed to create comment'
        };
      }
    } catch (e) {
      print('Create Comment API Error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.'
      };
    }
  }

  static Future<List<Comment>> getComments(String postId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/posts/$postId/comments'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final comments = (data['comments'] as List)
            .map((comment) => Comment.fromJson(comment))
            .toList();
        return comments;
      } else {
        throw Exception('Failed to load comments');
      }
    } catch (e) {
      print('Get Comments API Error: $e');
      return [];
    }
  }
}
