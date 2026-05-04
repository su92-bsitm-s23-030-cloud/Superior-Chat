const io = require('socket.io-client');

const socket = io('http://192.168.100.7:5000', {
  transports: ['polling', 'websocket'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');

  // Join a room
  socket.emit('join', 'testUser123');

  // Send a test message
  setTimeout(() => {
    socket.emit('private_message', {
      senderId: 'testUser123',
      receiverId: 'testUser456',
      message: 'Hello from test!',
      timestamp: new Date().toISOString(),
    });
  }, 1000);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (err) => {
  console.log('Connection error:', err);
});

socket.on('connect_timeout', () => {
  console.log('Connection timeout');
});

socket.on('reconnect', () => {
  console.log('Reconnected to Socket.IO server');
});

socket.on('reconnect_error', (err) => {
  console.log('Reconnection error:', err);
});

socket.on('private_message', (data) => {
  console.log('Received message:', data);
});

socket.on('message_sent', (data) => {
  console.log('Message sent confirmation:', data);
});

// Keep the script running for 10 seconds to test
setTimeout(() => {
  socket.disconnect();
  console.log('Test completed');
}, 10000);
