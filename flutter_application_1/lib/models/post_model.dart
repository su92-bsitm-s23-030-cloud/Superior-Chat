class Post {
  final String id;
  final String userId;
  final String content;
  final DateTime timestamp;
  final String? userName;
  final String? userProfilePicture;

  Post({
    required this.id,
    required this.userId,
    required this.content,
    required this.timestamp,
    this.userName,
    this.userProfilePicture,
  });

  // Create from JSON (API response)
  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'],
      userId: json['userId'] ?? json['user_id'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
      userName: json['name'],
      userProfilePicture: json['profile_picture'],
    );
  }

  // Convert to JSON for API requests
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'userName': userName,
      'userProfilePicture': userProfilePicture,
    };
  }

  @override
  String toString() {
    return 'Post(id: $id, userId: $userId, content: $content, timestamp: $timestamp)';
  }
}
