import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import ProfileSettings from './ProfileSettings';
import { 
  LogOut, 
  Menu, 
  Moon, 
  Sun, 
  Users, 
  MessageCircle,
  Settings,
  X,
  Bell,
  BellOff
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) return null;

  const getRoomTypeIcon = (room) => {
    if (!room) return null;
    return room.roomType === 'direct' ? MessageCircle : Users;
  };

  const getRoomInfo = (room) => {
    if (!room) return null;
    
    if (room.roomType === 'direct') {
      return `Direct Message`;
    }
    
    const memberCount = room.members?.length || 0;
    const onlineCount = room.onlineMembersCount || 0;
    
    return `${memberCount} members${onlineCount > 0 ? ` • ${onlineCount} online` : ''}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-10 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-20 w-80 h-full transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none`}
      >
        <Sidebar 
          activeRoom={activeRoom} 
          setActiveRoom={setActiveRoom} 
          setShowProfile={setShowProfile}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            {/* Mobile sidebar toggle - positioned first */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex-shrink-0"
            >
              {sidebarOpen ? (
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* {activeRoom && (
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-semibold shadow-sm flex-shrink-0 ${
                  activeRoom.avatar 
                    ? '' 
                    : activeRoom.roomType === 'direct'
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {activeRoom.avatar ? (
                    <img 
                      src={activeRoom.avatar} 
                      alt={activeRoom.name} 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover" 
                    />
                  ) : (
                    <span className="text-xs sm:text-sm">
                      {activeRoom.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                
             
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate flex items-center space-x-1 sm:space-x-2">
                    <span className="truncate">{activeRoom.name}</span>
                    {activeRoom.roomType === 'direct' && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1 truncate">
                    {React.createElement(getRoomTypeIcon(activeRoom), { 
                      className: "h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" 
                    })}
                    <span className="truncate">{getRoomInfo(activeRoom)}</span>
                  </p>
                </div>
              </div>
            )} */}
            
            {!activeRoom && (
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Chat App</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Welcome back, {user.username}</p>
                </div>
              </div>
            )}


            {activeRoom && (
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Chat App</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Welcome back, {user.username}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="hidden xs:block p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              )}
            </button>
            
            {/* User profile button */}
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 pr-2 sm:pr-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 group"
            >
              <div className="relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg object-cover" 
                    />
                  ) : (
                    <span className="font-semibold text-white text-xs sm:text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <span className="hidden md:block font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs sm:text-sm max-w-[80px] truncate">
                {user.username}
              </span>
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-105"
              title="Logout"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden relative">
          {activeRoom ? (
            <ChatArea room={activeRoom} />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                {/* Welcome illustration */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                    <MessageCircle className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg">👋</span>
                  </div>
                </div>
                
                {/* Welcome content */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Welcome back, {user.username}!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Choose a conversation from the sidebar to start chatting, or create a new group to connect with others.
                </p>
                
                {/* Quick actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Browse Rooms</span>
                  </button>
                  <button 
                    onClick={() => setShowProfile(true)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile settings modal */}
      {showProfile && (
        <ProfileSettings onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default Dashboard;