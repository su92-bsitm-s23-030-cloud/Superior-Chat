const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { databaseOperations } = require('./database_new');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Fix CORS for Flutter web
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

app.use(express.json());

// Store active users and messages
let activeUsers = new Map();
let messages = new Map(); // userId -> list of messages

// Pre-defined users - only these five users are allowed
const predefinedUsers = {
  'faseeh': {
    id: 'faseeh',
    name: 'Faseeh',
    email: 'faseeh@superior.edu.pk',
    profilePicture: 'https://ui-avatars.com/api/?name=Faseeh&background=6366f1&color=fff',
    isOnline: false
  },
  'tabrez': {
    id: 'tabrez',
    name: 'Tabrez',
    email: 'tabrez@superior.edu.pk',
    profilePicture: 'https://ui-avatars.com/api/?name=Tabrez&background=6366f1&color=fff',
    isOnline: false
  },
  'zain': {
    id: 'zain',
    name: 'Zain',
    email: 'zain@superior.edu.pk',
    profilePicture: 'https://ui-avatars.com/api/?name=Zain&background=6366f1&color=fff',
    isOnline: false
  },
  'adnan': {
    id: 'adnan',
    name: 'Adnan',
    email: 'adnan@superior.edu.pk',
    profilePicture: 'https://ui-avatars.com/api/?name=Adnan&background=6366f1&color=fff',
    isOnline: false
  },
  'muskan': {
    id: 'muskan',
    name: 'Muskan',
    email: 'muskan@superior.edu.pk',
    profilePicture: 'https://ui-avatars.com/api/?name=Muskan&background=6366f1&color=fff',
    isOnline: false
  }
};

app.get('/', (req, res) => {
  res.json({ message: 'Backend Working! 🎉' });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.endsWith('@superior.edu.pk')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email. Only @superior.edu.pk emails are allowed.'
      });
    }

    const userId = email.split('@')[0];

    // Check if user exists in database
    const user = await databaseOperations.getUserById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please register first or use one of the predefined users: faseeh@superior.edu.pk, tabrez@superior.edu.pk, zain@superior.edu.pk, adnan@superior.edu.pk, muskan@superior.edu.pk.'
      });
    }

    // Update user online status in database
    await databaseOperations.updateUserOnlineStatus(userId, true);

    // Update in-memory active users
    const activeUser = { ...user, isOnline: true };
    activeUsers.set(userId, activeUser);

    // Broadcast user online status to all connected clients
    io.emit('user_status_update', {
      userId: userId,
      isOnline: true,
      user: activeUser
    });

    res.json({
      success: true,
      user: activeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.endsWith('@superior.edu.pk')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email. Only @superior.edu.pk emails are allowed.'
      });
    }

    if (!password || password !== 'superior123') {
      return res.status(400).json({
        success: false,
        message: 'Invalid password.'
      });
    }

    const userId = email.split('@')[0];

    // Check if user already exists
    const existingUser = await databaseOperations.getUserById(userId);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please login instead.'
      });
    }

    // Create new user
    const name = userId.charAt(0).toUpperCase() + userId.slice(1);
    const profilePicture = `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;

    const newUser = {
      id: userId,
      name: name,
      email: email,
      profile_picture: profilePicture,
      is_online: 1,
      created_at: new Date().toISOString()
    };

    // Insert user into database
    await databaseOperations.createUser(newUser);

    // Update in-memory active users
    const activeUser = { ...newUser, isOnline: true };
    activeUsers.set(userId, activeUser);

    // Broadcast user online status to all connected clients
    io.emit('user_status_update', {
      userId: userId,
      isOnline: true,
      user: activeUser
    });

    res.json({
      success: true,
      user: activeUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.endsWith('@superior.edu.pk')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email. Only @superior.edu.pk emails are allowed.'
      });
    }

    const userId = email.split('@')[0];

    // Check if user exists in database, if not create one
    let user = await databaseOperations.getUserById(userId);
    if (!user) {
      // Create new user for Google login
      const name = userId.charAt(0).toUpperCase() + userId.slice(1);
      const profilePicture = `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;

      const newUser = {
        id: userId,
        name: name,
        email: email,
        profile_picture: profilePicture,
        is_online: 1,
        created_at: new Date().toISOString()
      };

      await databaseOperations.createUser(newUser);
      user = newUser;
    }

    // Update user online status in database
    await databaseOperations.updateUserOnlineStatus(userId, true);

    // Update in-memory active users
    const activeUser = { ...user, isOnline: true };
    activeUsers.set(userId, activeUser);

    // Broadcast user online status to all connected clients
    io.emit('user_status_update', {
      userId: userId,
      isOnline: true,
      user: activeUser
    });

    res.json({
      success: true,
      user: activeUser
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await databaseOperations.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get messages between two users
app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const messages = await databaseOperations.getMessagesBetweenUsers(userId, otherUserId);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Save message via API
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, message, timestamp } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Sender ID, receiver ID, and message are required'
      });
    }

    const messageData = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      message,
      timestamp: timestamp || new Date().toISOString(),
      isRead: false
    };

    await databaseOperations.saveMessage(messageData);

    res.json({
      success: true,
      message: messageData
    });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Posts endpoints
app.post('/api/posts', async (req, res) => {
  try {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: 'User ID and content are required'
      });
    }

    const postData = {
      id: Date.now().toString(),
      userId,
      content,
      timestamp: new Date().toISOString()
    };

    await databaseOperations.savePost(postData);

    // Broadcast new post to all connected clients
    io.emit('new_post', postData);

    res.json({
      success: true,
      post: postData
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await databaseOperations.getAllPosts();
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Comments endpoints
app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: 'User ID and content are required'
      });
    }

    const commentData = {
      id: Date.now().toString(),
      postId,
      userId,
      content,
      timestamp: new Date().toISOString()
    };

    await databaseOperations.saveComment(commentData);

    // Broadcast new comment to all connected clients
    io.emit('new_comment', commentData);

    res.json({
      success: true,
      comment: commentData
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await databaseOperations.getCommentsForPost(postId);
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins their room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle private messages
  socket.on('private_message', async (data) => {
    try {
      const { senderId, receiverId, message, timestamp } = data;

      const messageData = {
        id: Date.now().toString(),
        senderId,
        receiverId,
        message,
        timestamp,
        isRead: false
      };

      // Save message to database
      await databaseOperations.saveMessage(messageData);

      // Send to receiver
      io.to(receiverId).emit('private_message', messageData);

      // Send confirmation to sender
      socket.emit('message_sent', messageData);
    } catch (error) {
      console.error('Save message error:', error);
      socket.emit('message_error', { error: 'Failed to save message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { senderId, receiverId, isTyping } = data;
    io.to(receiverId).emit('typing_indicator', { senderId, isTyping });
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);

    // Find which user disconnected and update their status
    for (const [userId, user] of activeUsers.entries()) {
      // Check if this user has no active connections
      const userSockets = await io.in(userId).fetchSockets();
      if (userSockets.length === 0) {
        // Update user offline status in database
        await databaseOperations.updateUserOnlineStatus(userId, false);

        // Broadcast user offline status to all connected clients
        io.emit('user_status_update', {
          userId: userId,
          isOnline: false,
          user: { ...user, isOnline: false }
        });

        // Remove from active users
        activeUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log('🚀 Server running on port ' + PORT);
  console.log('📡 Socket.IO enabled for real-time messaging');
});
