const io = require('socket.io-client');

// Test 1: Basic connection and message sending/receiving with two clients
console.log('=== Test 1: Basic Connection and Messaging ===');

const client1 = io('http://192.168.100.7:5000', {
  transports: ['polling', 'websocket'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

const client2 = io('http://192.168.100.7:5000', {
  transports: ['polling', 'websocket'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

let testResults = {
  connection: false,
  join: false,
  sendMessage: false,
  receiveMessage: false,
  typing: false,
  disconnection: false,
  reconnection: false,
  errorHandling: false,
  persistence: false
};

client1.on('connect', () => {
  console.log('Client1 connected');
  testResults.connection = true;
  client1.emit('join', 'testUser123');
});

client2.on('connect', () => {
  console.log('Client2 connected');
  client2.emit('join', 'testUser456');
});

client1.on('private_message', (data) => {
  console.log('Client1 received message:', data);
  testResults.receiveMessage = true;
});

client2.on('private_message', (data) => {
  console.log('Client2 received message:', data);
  testResults.receiveMessage = true;
});

client1.on('message_sent', (data) => {
  console.log('Client1 message sent confirmation:', data);
  testResults.sendMessage = true;
});

client2.on('message_sent', (data) => {
  console.log('Client2 message sent confirmation:', data);
  testResults.sendMessage = true;
});

client1.on('typing_indicator', (data) => {
  console.log('Client1 typing indicator:', data);
  testResults.typing = true;
});

client2.on('typing_indicator', (data) => {
  console.log('Client2 typing indicator:', data);
  testResults.typing = true;
});

client1.on('disconnect', () => {
  console.log('Client1 disconnected');
  testResults.disconnection = true;
});

client2.on('disconnect', () => {
  console.log('Client2 disconnected');
});

client1.on('reconnect', () => {
  console.log('Client1 reconnected');
  testResults.reconnection = true;
});

client2.on('reconnect', () => {
  console.log('Client2 reconnected');
  testResults.reconnection = true;
});

client1.on('connect_error', (err) => {
  console.log('Client1 connection error:', err);
});

client2.on('connect_error', (err) => {
  console.log('Client2 connection error:', err);
});

// Start tests after connections
setTimeout(() => {
  console.log('=== Test 2: Sending Messages ===');
  client1.emit('private_message', {
    senderId: 'testUser123',
    receiverId: 'testUser456',
    message: 'Hello from Client1!',
    timestamp: new Date().toISOString(),
  });

  setTimeout(() => {
    client2.emit('private_message', {
      senderId: 'testUser456',
      receiverId: 'testUser123',
      message: 'Hello back from Client2!',
      timestamp: new Date().toISOString(),
    });
  }, 2000);

  setTimeout(() => {
    console.log('=== Test 3: Typing Indicators ===');
    client1.emit('typing', { senderId: 'testUser123', receiverId: 'testUser456', isTyping: true });
    setTimeout(() => {
      client1.emit('typing', { senderId: 'testUser123', receiverId: 'testUser456', isTyping: false });
    }, 1000);
  }, 4000);

  setTimeout(() => {
    console.log('=== Test 4: Disconnection and Reconnection ===');
    client1.disconnect();
    setTimeout(() => {
      // Reconnect manually by creating new connection
      console.log('Attempting to reconnect Client1...');
      client1.connect();
    }, 2000);
  }, 6000);

  setTimeout(() => {
    console.log('=== Test 5: Error Scenarios ===');
    // Test invalid message
    client1.emit('private_message', {
      senderId: 'invalidUser',
      receiverId: 'testUser456',
      message: '',
      timestamp: new Date().toISOString(),
    });
  }, 8000);

  setTimeout(() => {
    console.log('=== Test 6: Checking Persistence ===');
    // We'll check database after tests
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const db = new sqlite3.Database(path.join(__dirname, 'superior_messenger.db'));
    db.all("SELECT * FROM messages WHERE sender_id = 'testUser123' OR receiver_id = 'testUser123'", (err, rows) => {
      if (err) {
        console.error('Database error:', err);
      } else {
        console.log('Messages in database:', rows.length);
        testResults.persistence = rows.length > 0;
      }
      db.close();
    });
  }, 10000);

  setTimeout(() => {
    console.log('=== Test Results ===');
    console.log(testResults);
    client1.disconnect();
    client2.disconnect();
    console.log('All tests completed');
  }, 12000);
}, 2000);
