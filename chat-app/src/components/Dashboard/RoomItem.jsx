import React from 'react';
import { Users, User, Crown, Volume2, VolumeX } from 'lucide-react';

const RoomItem = ({ room, isActive, onClick, showOnlineCount = true }) => {
  const getAvatarInitials = (name) => {
    return name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : '?';
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getOnlineStatus = () => {
    if (room.roomType === 'direct' && room.members) {
      // For direct messages, check if the other user is online
      const otherUser = room.members.find(member => member._id !== room.currentUserId);
      return otherUser?.isOnline;
    }
    return false;
  };

  return (
    <li className="px-2">
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-xl flex items-center transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm ${
          isActive
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 shadow-sm'
            : 'hover:scale-[1.02]'
        }`}
      >
        {/* Avatar */}
        <div className="relative mr-3 flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-sm ${
            room.avatar 
              ? '' 
              : room.roomType === 'direct'
                ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            {room.avatar ? (
              <img 
                src={room.avatar} 
                alt={room.name} 
                className="w-12 h-12 rounded-xl object-cover" 
              />
            ) : (
              <span>{getAvatarInitials(room.name)}</span>
            )}
          </div>
          
          {/* Online indicator for direct messages */}
          {room.roomType === 'direct' && getOnlineStatus() && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          )}
          
          {/* Unread count badge */}
          {room.unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${
                isActive 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {room.name}
              </h3>
              
              {/* Room type icons */}
              {room.isAdmin && (
                <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" title="Admin" />
              )}
              {room.isMuted && (
                <VolumeX className="h-4 w-4 text-gray-400 flex-shrink-0" title="Muted" />
              )}
            </div>
            
            {/* Last message time */}
            {room.lastMessage?.timestamp && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                {formatLastMessageTime(room.lastMessage.timestamp)}
              </span>
            )}
          </div>
          
          {/* Member info */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              {room.roomType === 'direct' ? (
                <div className="flex items-center">
                  <User className="h-3.5 w-3.5 mr-1" />
                  <span>{getOnlineStatus() ? 'Online' : 'Direct Message'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    <span>{room.members?.length || 0}</span>
                  </div>
                  {showOnlineCount && room.onlineMembersCount !== undefined && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {room.onlineMembersCount}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Last message preview */}
          {room.lastMessage ? (
            <div className="flex items-center space-x-1">
              <p className={`text-sm truncate ${
                room.unreadCount > 0 
                  ? 'text-gray-900 dark:text-white font-medium' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {room.roomType !== 'direct' && (
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {room.lastMessage.senderName === room.currentUserName ? 'You' : room.lastMessage.senderName}:{' '}
                  </span>
                )}
                {room.lastMessage.messageType === 'file' ? (
                  <span className="italic">📎 {room.lastMessage.fileName || 'File'}</span>
                ) : (
                  room.lastMessage.content
                )}
              </p>
            </div>
          ) : room.description ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate italic">
              {room.description}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  );
};

export default RoomItem;