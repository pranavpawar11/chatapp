import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { format } from 'date-fns';
import { MessageCirclePlus, Clock } from 'lucide-react';

const MessagesTab = ({ activeRoom, setActiveRoom, searchQuery }) => {
  const [directChats, setDirectChats] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { socket, connected, onlineUsers, messages } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch existing direct chats
      const roomsResponse = await axios.get('/rooms');
      const directRooms = roomsResponse.data.filter(room => room.roomType === 'direct');
      
      // Fetch all users
      const usersResponse = await axios.get('/user/search?query=');
      const allUsers = usersResponse.data.filter(u => u._id !== user._id);
      
      // Enhance direct chats with user info and online status
      const enhancedChats = directRooms.map(room => {
        const otherUser = room.members.find(member => member._id !== user._id);
        const isOnline = onlineUsers.some(u => u.userId === otherUser?._id);
        
        return {
          ...room,
          otherUser,
          isOnline,
          unreadCount: 0,
          type: 'chat'
        };
      });

      // Get users who don't have existing chats
      const chatUserIds = enhancedChats.map(chat => chat.otherUser?._id).filter(Boolean);
      const usersWithoutChats = allUsers
        .filter(u => !chatUserIds.includes(u._id))
        .map(u => ({
          ...u,
          isOnline: onlineUsers.some(ou => ou.userId === u._id),
          type: 'user'
        }));

      setDirectChats(enhancedChats);
      setAvailableUsers(usersWithoutChats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages data:', error);
      setLoading(false);
    }
  }, [user._id, onlineUsers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for new direct messages
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (message) => {
      if (message.messageType !== 'direct') return;
      
      setDirectChats(prevChats => 
        prevChats.map(chat => {
          if (chat._id === message.roomId && message.senderId !== user._id) {
            return {
              ...chat,
              unreadCount: chat.unreadCount + 1,
              lastMessage: message
            };
          }
          return chat;
        })
      );
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, connected, user._id]);

  // Update online status when onlineUsers changes
  useEffect(() => {
    setDirectChats(prevChats => 
      prevChats.map(chat => ({
        ...chat,
        isOnline: onlineUsers.some(u => u.userId === chat.otherUser?._id)
      }))
    );
    
    setAvailableUsers(prevUsers =>
      prevUsers.map(user => ({
        ...user,
        isOnline: onlineUsers.some(u => u.userId === user._id)
      }))
    );
  }, [onlineUsers]);

  const getLastMessage = (roomId) => {
    const roomMessages = messages[roomId] || [];
    return roomMessages[roomMessages.length - 1];
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'a long time ago';
    const now = new Date();
    const diff = (now - new Date(lastSeen)) / 1000;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(lastSeen).toLocaleDateString();
  };

  const startDirectMessage = async (userId) => {
    try {
      const response = await axios.post('/messages/direct', { 
        receiverId: userId,
        content: '' 
      });
      setActiveRoom(response.data.room);
      
      // Refresh data to move user from available to chats
      fetchData();
    } catch (error) {
      console.error('Failed to start direct message:', error);
    }
  };

  // Filter items based on search query
  const filteredChats = directChats.filter(chat =>
    chat.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const DirectChatItem = ({ chat }) => {
    const lastMessage = getLastMessage(chat._id);
    
    return (
      <li key={chat._id}>
        <button
          onClick={() => setActiveRoom(chat)}
          className={`w-full text-left p-3 rounded-xl flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
            activeRoom && activeRoom._id === chat._id
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
              : ''
          }`}
        >
          <div className="relative mr-3">
            <div className="bg-gradient-to-br from-purple-400 to-pink-400 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold">
              {chat.otherUser?.avatar ? (
                <img 
                  src={chat.otherUser.avatar} 
                  alt={chat.otherUser.username} 
                  className="w-12 h-12 rounded-full object-cover" 
                />
              ) : (
                <span className="text-lg">
                  {chat.otherUser?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {chat.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {chat.otherUser?.username}
              </h4>
              {lastMessage && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {format(new Date(lastMessage.timestamp), 'HH:mm')}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {lastMessage ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {lastMessage.senderId === user._id ? 'You: ' : ''}
                    {lastMessage.content}
                  </p>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {chat.isOnline ? (
                      <span className="text-green-500 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 inline-block"></span>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Last seen {formatLastSeen(chat.otherUser?.lastSeen)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {chat.unreadCount > 0 && (
                <div className="bg-blue-500 text-white text-xs font-medium rounded-full px-2 py-1 min-w-[20px] text-center ml-2">
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </div>
              )}
            </div>
          </div>
        </button>
      </li>
    );
  };

  const UserItem = ({ user }) => (
    <li key={user._id}>
      <button
        onClick={() => startDirectMessage(user._id)}
        className="w-full text-left p-3 rounded-xl flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
      >
        <div className="relative mr-3">
          <div className="bg-gradient-to-br from-blue-400 to-indigo-400 w-11 h-11 rounded-full flex items-center justify-center text-white font-medium">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="w-11 h-11 rounded-full object-cover" 
              />
            ) : (
              <span>
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {user.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {user.username}
            </h4>
            <MessageCirclePlus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user.isOnline ? (
              <span className="text-green-500 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 inline-block"></span>
                Online
              </span>
            ) : (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last seen {formatLastSeen(user.lastSeen)}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );

  const hasContent = filteredChats.length > 0 || filteredUsers.length > 0;

  if (!hasContent && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageCirclePlus className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-2">No results found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Try searching for a different name
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recent Chats */}
      {filteredChats.length > 0 && (
        <div>
          <div className="px-4 mb-3">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Recent Chats
            </h4>
          </div>
          <ul className="space-y-1 px-2">
            {filteredChats.map(chat => (
              <DirectChatItem key={chat._id} chat={chat} />
            ))}
          </ul>
        </div>
      )}

      {/* Available Users */}
      {filteredUsers.length > 0 && (
        <div>
          <div className="px-4 mb-3">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Start New Chat
            </h4>
          </div>
          <ul className="space-y-1 px-2">
            {filteredUsers.map(user => (
              <UserItem key={user._id} user={user} />
            ))}
          </ul>
        </div>
      )}

      {!hasContent && !searchQuery && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
            <MessageCirclePlus className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Start a conversation with someone from your team. Your recent chats will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesTab;