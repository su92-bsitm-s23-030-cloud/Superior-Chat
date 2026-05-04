class User {
  final String id;
  final String name;
  final String email;
  final String? profilePicture;
  final bool isOnline;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.profilePicture,
    required this.isOnline,
    this.createdAt,
  });

  // Convert to Map for database storage
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'profilePicture': profilePicture,
      'isOnline': isOnline ? 1 : 0,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  // Create from Map (database retrieval)
  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      name: map['name'],
      email: map['email'],
      profilePicture: map['profilePicture'] ?? map['profile_picture'],
      isOnline: map['isOnline'] == 1 || map['is_online'] == 1,
      createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : null,
    );
  }

  // Create from JSON (API response)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      profilePicture: json['profilePicture'] ?? json['profile_picture'],
      isOnline: json['isOnline'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }

  // Convert to JSON for API requests
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'profilePicture': profilePicture,
      'isOnline': isOnline,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, isOnline: $isOnline)';
  }
}
