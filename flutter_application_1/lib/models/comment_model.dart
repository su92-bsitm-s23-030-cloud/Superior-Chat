class Comment {
  final String id;
  final String postId;
  final String userId;
  final String content;
  final DateTime timestamp;
  final String? userName;
  final String? userProfilePicture;

  Comment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.content,
    required this.timestamp,
    this.userName,
    this.userProfilePicture,
  });

  // Create from JSON (API response)
  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'],
      postId: json['postId'] ?? json['post_id'],
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
      'postId': postId,
      'userId': userId,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'userName': userName,
      'userProfilePicture': userProfilePicture,
    };
  }

  @override
  String toString() {
    return 'Comment(id: $id, postId: $postId, userId: $userId, content: $content, timestamp: $timestamp)';
  }
}
