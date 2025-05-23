import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import ChatDashboard from './components/ChatDashboard';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme));
    }

    // Check for saved user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              currentUser ? (
                <Navigate to="/chat" replace />
              ) : (
                <LoginSignup onLogin={handleLogin} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
              )
            } 
          />
          <Route 
            path="/chat" 
            element={
              currentUser ? (
                <ChatDashboard 
                  currentUser={currentUser} 
                  onLogout={handleLogout}
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/room/:roomId" 
            element={
              currentUser ? (
                <ChatDashboard 
                  currentUser={currentUser} 
                  onLogout={handleLogout}
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;