import React, { useState } from 'react';

const LoginSignup = ({ onLogin, isDarkMode, setIsDarkMode }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        const user = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: username.trim(),
          joinedAt: new Date().toISOString()
        };
        onLogin(user);
        setIsLoading(false);
      }, 1000);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <h2 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              💬 ChatRoom
            </h2>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter your name to join the conversation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Name
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter your display name"
              maxLength={30}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your name will be visible to other users in the chat
            </p>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !username.trim() || isLoading
                ? isDarkMode 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              'Join Chat Room 🚀'
            )}
          </button>
        </form>

        {/* Features */}
        <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            ✨ Features
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              📱 Mobile Responsive
            </div>
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              ⚡ Real-time Chat
            </div>
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              🏠 Multiple Rooms
            </div>
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              👥 Online Users
            </div>
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              🆕 Create Rooms
            </div>
            <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              🔗 Join by ID
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="mb-1">🎯 <strong>How to use:</strong></p>
          <p>• Create or join rooms using room IDs</p>
          <p>• Share room IDs with friends</p>
          <p>• Chat in real-time with online users</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;