import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import RoomList from './RoomList';
import MessagesTab from './MessagesTab'; // New combined component
import CreateRoomModal from './CreateRoomModal';
import { Plus, MessageSquare, MessageCircle, Settings, Search } from 'lucide-react';

const Sidebar = ({ activeRoom, setActiveRoom, setShowProfile }) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { onlineUsers } = useSocket();

  const tabs = [
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'groups', label: 'Groups', icon: MessageSquare }
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'messages' ? 'Search messages or people...' : 'Search groups...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Tab navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {activeTab === 'messages' && (
              <>
                <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {onlineUsers.length} online
                  </span>
                </div>
              </>
            )}
            {activeTab === 'groups' && (
              <>
                <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Group Chats</h3>
              </>
            )}
          </div>
          
          {activeTab === 'groups' && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm hover:shadow-md"
              title="Create Group"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="py-2">
          {activeTab === 'messages' && (
            <MessagesTab 
              activeRoom={activeRoom} 
              setActiveRoom={setActiveRoom}
              searchQuery={searchQuery}
            />
          )}
          {activeTab === 'groups' && (
            <RoomList 
              activeRoom={activeRoom} 
              setActiveRoom={setActiveRoom}
              roomType="group"
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => setShowProfile(true)}
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-left flex items-center justify-between transition-all duration-200 hover:shadow-sm group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Profile Settings</span>
          </div>
          <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Create room modal */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
    </div>
  );
};

export default Sidebar;