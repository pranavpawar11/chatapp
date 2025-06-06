import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserItem from './UserItem';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const UserList = ({ setActiveRoom }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { onlineUsers, socket } = useSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/user/search?query=');
        setUsers(response.data.filter(u => u._id !== user._id));
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // Request online users when component mounts or socket reconnects
  useEffect(() => {
    if (socket && socket.connected) {
      // Request current online users from server
      socket.emit('getOnlineUsers');
    }
  }, [socket]);

  // Listen for socket connection events
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected, requesting online users');
      socket.emit('getOnlineUsers');
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // If already connected, request online users
    if (socket.connected) {
      socket.emit('getOnlineUsers');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  const startDirectMessage = async (userId) => {
    try {

      const response = await axios.post('/messages/direct', { 
                receiverId: userId,
                content: '' 
              });
      setActiveRoom(response.data.room);
    } catch (error) {
      console.error('Failed to start direct message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {users.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 p-4">
          No users found
        </p>
      ) : (
        <ul className="space-y-1">
          {users.map(user => (
            <UserItem 
              key={user._id}
              user={user}
              isOnline={onlineUsers.some(u => u.userId === user._id)}
              onClick={() => startDirectMessage(user._id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;