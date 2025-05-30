const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  )
});

const db = admin.firestore();

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Store online users and rooms
const onlineUsers = new Map();
const roomUsers = new Map();

// Initialize default rooms in Firebase
const initializeDefaultRooms = async () => {
  const defaultRooms = [
    { id: 'general', name: 'General' },
    { id: 'random', name: 'Random' },
    { id: 'tech', name: 'Tech' },
    { id: 'gaming', name: 'Gaming' }
  ];

  for (const room of defaultRooms) {
    try {
      const roomDoc = await db.collection('rooms').doc(room.id).get();
      if (!roomDoc.exists) {
        await db.collection('rooms').doc(room.id).set({
          id: room.id,
          name: room.name,
          createdBy: 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isPublic: true,
          isDefault: true
        });
        console.log(`Default room '${room.name}' created`);
      }
    } catch (error) {
      console.error(`Error creating default room ${room.name}:`, error);
    }
  }
};

const ensureRoomExists = async (roomId) => {
  try {
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      const defaultRooms = ['general', 'random', 'tech', 'gaming'];
      if (defaultRooms.includes(roomId)) {
        await db.collection('rooms').doc(roomId).set({
          id: roomId,
          name: roomId.charAt(0).toUpperCase() + roomId.slice(1),
          createdBy: 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isPublic: true,
          isDefault: true
        });
        console.log(`Created missing default room: ${roomId}`);
        return true;
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error ensuring room exists: ${roomId}`, error);
    return false;
  }
};


initializeDefaultRooms();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins
  socket.on('user_join', async (userData) => {
    try {
      const user = {
        id: userData.id,
        name: userData.name,
        socketId: socket.id,
        joinedAt: new Date().toISOString(),
        currentRoom: null
      };

      onlineUsers.set(socket.id, user);

      // Save user to Firebase
      await db.collection('onlineUsers').doc(user.id).set({
        ...user,
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`User ${user.name} connected`);
      
      // Send updated global user list
      const allUsers = Array.from(onlineUsers.values());
      io.emit('users_updated', allUsers);
      
    } catch (error) {
      console.error('Error handling user join:', error);
    }
  });

  // Join room
  socket.on('join_room', async (data) => {
    try {
      const { roomId, userId } = data;
      const user = onlineUsers.get(socket.id);
      
      if (!user) {
        console.error('User not found for socket:', socket.id);
        return;
      }

      const roomExists = await ensureRoomExists(roomId);
      if (!roomExists) {
        socket.emit('room_not_found', { roomId });
        return;
      }

      const previousRoom = user.currentRoom;
      
      if (previousRoom) {
        socket.leave(previousRoom);
        if (roomUsers.has(previousRoom)) {
          roomUsers.get(previousRoom).delete(socket.id);
          const prevRoomUsers = Array.from(roomUsers.get(previousRoom) || [])
            .map(socketId => onlineUsers.get(socketId))
            .filter(user => user);
          io.to(previousRoom).emit('users_updated', prevRoomUsers);
        }
      }

      // Join new room
      socket.join(roomId);
      user.currentRoom = roomId;
      
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);

      // Update user in Firebase
      try {
        await db.collection('onlineUsers').doc(userId).update({
          currentRoom: roomId,
          lastSeen: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (fbError) {
        console.error('Error updating user in Firebase:', fbError);
      }

      // Emit updated user list to new room
      const newRoomUsers = Array.from(roomUsers.get(roomId) || [])
        .map(socketId => onlineUsers.get(socketId))
        .filter(user => user);
      
      io.to(roomId).emit('users_updated', newRoomUsers);
      
      console.log(`User ${user.name} joined room ${roomId}`);
      
      // Confirm room join to the user
      socket.emit('room_joined', { roomId, success: true });
      
    } catch (error) {
      console.error('Error handling room join:', error);
      socket.emit('room_join_failed', { roomId: data.roomId, error: error.message });
    }
  });

  // Send message
  socket.on('send_message', async (messageData) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) {
        console.error('User not found for message send:', socket.id);
        return;
      }

      if (user.currentRoom !== messageData.room) {
        console.warn(`User ${user.name} tried to send message to room ${messageData.room} but is in ${user.currentRoom}`);
        socket.emit('message_failed', { error: 'Not in the specified room' });
        return;
      }

      // Ensure room exists
      const roomExists = await ensureRoomExists(messageData.room);
      if (!roomExists) {
        socket.emit('message_failed', { error: 'Room does not exist' });
        return;
      }

      const timestamp = new Date().toISOString();
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message = {
        id: messageId,
        text: messageData.text,
        userId: user.id,
        userName: user.name,
        room: messageData.room,
        timestamp: timestamp
      };

      try {
        await db.collection('messages').doc(messageId).set({
          ...message,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Message saved to Firebase: ${messageId} in room ${messageData.room}`);
      } catch (fbError) {
        console.error('Error saving message to Firebase:', fbError);
        socket.emit('message_failed', { error: 'Failed to save message' });
        return;
      }

      io.to(messageData.room).emit('new_message', message);

      console.log(`Message sent in room ${messageData.room} by ${user.name}: "${messageData.text}"`);
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message_failed', { error: 'Failed to send message' });
    }
  });

  // Create room
  socket.on('create_room', async (data) => {
    try {
      const { roomName, userId } = data;
      const user = onlineUsers.get(socket.id);
      
      if (!user) {
        socket.emit('room_creation_failed', { error: 'User not found' });
        return;
      }

      const cleanName = roomName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const roomId = `${cleanName}_${Date.now()}`;
      
      await db.collection('rooms').doc(roomId).set({
        id: roomId,
        name: roomName,
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isPublic: true,
        isDefault: false
      });

      socket.emit('room_created', { roomId, roomName });
      console.log(`Room ${roomName} created with ID: ${roomId} by ${user.name}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('room_creation_failed', { error: 'Failed to create room' });
    }
  });

  // Get room info
  socket.on('get_room_info', async (roomId) => {
    try {
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      if (roomDoc.exists) {
        const roomData = roomDoc.data();
        socket.emit('room_info', { 
          id: roomId, 
          name: roomData.name,
          ...roomData 
        });
      } else {
        socket.emit('room_not_found', { roomId });
      }
    } catch (error) {
      console.error('Error getting room info:', error);
      socket.emit('room_not_found', { roomId });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    try {
      const user = onlineUsers.get(socket.id);
      if (user) {
        const currentRoom = user.currentRoom;
        
        if (currentRoom && roomUsers.has(currentRoom)) {
          roomUsers.get(currentRoom).delete(socket.id);
          const roomUsersList = Array.from(roomUsers.get(currentRoom) || [])
            .map(socketId => onlineUsers.get(socketId))
            .filter(user => user);
          io.to(currentRoom).emit('users_updated', roomUsersList);
        }

        try {
          await db.collection('onlineUsers').doc(user.id).delete();
        } catch (firebaseError) {
          console.error('Error removing user from Firebase:', firebaseError);
        }
        
        onlineUsers.delete(socket.id);
        
        console.log(`User ${user.name} disconnected`);

        const allUsers = Array.from(onlineUsers.values());
        io.emit('users_updated', allUsers);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// REST API Routes
app.get('/api/rooms', async (req, res) => {
  try {
    const roomsSnapshot = await db.collection('rooms')
      .where('isPublic', '==', true)
      .limit(50)
      .get();
    
    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});


app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(`Loading messages for room: ${roomId}`);
    
    await ensureRoomExists(roomId);

    const messagesSnapshot = await db.collection('messages')
      .where('room', '==', roomId)
      .limit(100)
      .get();
    
    console.log(`Found ${messagesSnapshot.docs.length} messages for room ${roomId}`);
    
    let messages = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp;
      
      if (data.timestamp) {
        timestamp = data.timestamp;
      } else if (data.createdAt && data.createdAt.toDate) {
        timestamp = data.createdAt.toDate().toISOString();
      } else {
        timestamp = new Date().toISOString();
      }
      
      return {
        id: data.id || doc.id,
        text: data.text || '',
        userId: data.userId || '',
        userName: data.userName || 'Unknown',
        room: data.room || roomId,
        timestamp: timestamp
      };
    });
    
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log(`Returning ${messages.length} messages for room ${roomId}`);
    res.json(messages);
    
  } catch (error) {
    console.error('Error fetching messages for room', req.params.roomId, ':', error);
    
    res.json([]);
  }
});

app.delete('/api/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messagesSnapshot = await db.collection('messages')
      .where('room', '==', roomId)
      .get();
    
    if (messagesSnapshot.empty) {
      res.json({ success: true, message: 'No messages to delete' });
      return;
    }

    const batch = db.batch();
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    io.to(roomId).emit('messages_cleared', { roomId });
    
    res.json({ success: true, deleted: messagesSnapshot.docs.length });
  } catch (error) {
    console.error('Error clearing messages:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    onlineUsers: onlineUsers.size,
    rooms: roomUsers.size
  });
});

// Add error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});