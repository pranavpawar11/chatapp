import React from 'react';
import { MessageCirclePlus, Clock } from 'lucide-react';

const UserItem = ({ user, isOnline, onClick, showStartChatIcon = false }) => {
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'a long time ago';
    const now = new Date();
    const diff = (now - new Date(lastSeen)) / 1000;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(lastSeen).toLocaleDateString();
  };

  return (
    <li>
      <button
        onClick={onClick}
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
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {user.username}
            </h4>
            {showStartChatIcon && (
              <MessageCirclePlus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOnline ? (
              <span className="text-green-500 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </span>
            ) : (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last seen {formatLastSeen(user.lastSeen)}
              </span>
            )}
          </p>
        </div>
      </button>
    </li>
  );
};

export default UserItem;