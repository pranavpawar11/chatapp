import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({});  
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {

    // Only initialize socket if user is authenticated
    if (user) {
      initializeSocket();
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user]); // Only re-run effect if user reference changes

  const initializeSocket = () => {
    const token = localStorage.getItem('token');

    socket.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      // Request online users when connected
      socket.current.emit('getOnlineUsers');
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setOnlineUsers([]); // Clear online users on disconnect
    });

    socket.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    // Handle online users list (initial and updates)
    socket.current.on('online_users', (users) => {
      console.log('Received online users:', users);
      setOnlineUsers(users);
    });

    // User status events
    socket.current.on('user_online', (data) => {
      console.log('User came online:', data);
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, data];
      });
    });

    socket.current.on('user_offline', (data) => {
      console.log('User went offline:', data);
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Message events
    socket.current.on('new_message', (message) => {
      setMessages(prev => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message]
      }));
    });

    socket.current.on('message_status_updated', (data) => {
      // console.log('Message status updated:', data);
      setMessages(prev => ({
        ...prev,
        [data.roomId]: (prev[data.roomId] || []).map(msg =>
          msg._id === data.messageId ? { ...msg, status: data.status } : msg
        )
      }));
    });

    // Typing events
    socket.current.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const currentTyping = prev[data.roomId] || [];
        if (!currentTyping.includes(data.username)) {
          return {
            ...prev,
            [data.roomId]: [...currentTyping, data.username]
          };
        }
        return prev;
      });
    });

    socket.current.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.roomId]: (prev[data.roomId] || []).filter(u => u !== data.username)
      }));
    });

    // Room events
    socket.current.on('room_joined', (data) => {
      console.log('Joined room:', data);
    });

    socket.current.on('user_joined_room', (data) => {
      console.log('User joined room:', data);
    });

    socket.current.on('roomCreated', (room) => {
      console.log('New room created:', room);
    });

    socket.current.on('roomUpdated', (room) => {
      console.log('Room updated:', room);
    });

    socket.current.on('roomDeleted', (roomId) => {
      console.log('Room deleted:', roomId);
    });

    socket.current.on('room_created', (data) => {
      console.log('Room creation response:', data);
    });

    socket.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
  };

  const joinRoom = (roomId) => {
    if (socket.current && connected) {
      socket.current.emit('join_room', { roomId });
    }
  };

  const createRoom = (roomData) => {
    if (socket.current && connected) {
      socket.current.emit('create_room', roomData);
    }
  };

  const sendMessage = (messageData) => {
    if (socket.current && connected) {
      socket.current.emit('send_message', messageData);
    }
  };

  const startTyping = (roomId) => {
    if (socket.current && connected) {
      socket.current.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket.current && connected) {
      socket.current.emit('typing_stop', { roomId });
    }
  };

  const markMessageSeen = (messageId, roomId) => {
    if (socket.current && connected) {
      socket.current.emit('message_seen', { messageId });
    }
  };

  // Requests current online users list
  const requestOnlineUsers = () => {
    if (socket.current && connected) {
      socket.current.emit('getOnlineUsers');
    }
  };

  const setRoomMessages = (roomId, messages) => {
    setMessages(prev => ({
      ...prev,
      [roomId]: messages
    }));
  };

  const getRoomMessages = (roomId) => {
    return messages[roomId] || [];
  };


  const value = {
    socket: socket.current,
    connected,
    onlineUsers,
    messages,
    typingUsers,
    joinRoom,
    createRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageSeen,
    requestOnlineUsers,
    setRoomMessages,
    getRoomMessages,
    markMessageAsSeen: (messageId, roomId) => {
      if (socket.current && connected) {
        socket.current.emit('message_seen', {
          messageId,
          roomId
        });
      }
    },
    reportMessageDelivered: (messageId) => {
      if (socket.current && connected) {
        socket.current.emit('message_delivered', messageId);
      }
    },
    reportMessageDelivered: (messageId) => {
      if (socket.current && connected) {
        socket.current.emit('message_delivered', messageId);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};