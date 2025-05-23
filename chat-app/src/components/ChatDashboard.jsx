import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const ChatDashboard = ({ currentUser, onLogout, isDarkMode, setIsDarkMode }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState(roomId || 'general');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState([
    { id: 'general', name: 'General' },
    { id: 'random', name: 'Random' },
    { id: 'tech', name: 'Tech' },
    { id: 'gaming', name: 'Gaming' }
  ]);
  const [newRoomName, setNewRoomName] = useState('');
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // NEW: Track if user has successfully joined the current room
  const [roomJoinStatus, setRoomJoinStatus] = useState(new Map());

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      
      // Join as user
      socketRef.current.emit('user_join', currentUser);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setRoomJoinStatus(new Map()); // Clear room join status on disconnect
      console.log('Disconnected from server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Handle new messages
    socketRef.current.on('new_message', (message) => {
      console.log('Received message:', message);
      setMessages(prevMessages => {
        return prevMessages.concat(message);
      });
    });

    socketRef.current.on('users_updated', (users) => {
      console.log('Users updated:', users);
      setOnlineUsers(users || []);
    });

    socketRef.current.on('room_created', (data) => {
      console.log('Room created:', data);
      const newRoom = { id: data.roomId, name: data.roomName };
      setRooms(prevRooms => {
        const roomExists = prevRooms.find(room => room.id === data.roomId);
        if (!roomExists) {
          return [...prevRooms, newRoom];
        }
        return prevRooms;
      });
      setNewRoomName('');
      setShowRoomInput(false);
      setIsLoading(false); // FIXED: Reset loading state here
      
      // FIXED: Use a timeout to ensure room is created on server before switching
      setTimeout(() => {
        changeRoom(data.roomId);
      }, 500);
    });

    socketRef.current.on('room_creation_failed', (data) => {
      console.error('Room creation failed:', data);
      alert('Failed to create room: ' + data.error);
      setIsLoading(false);
    });

    socketRef.current.on('room_info', (roomData) => {
      console.log('Room info received:', roomData);
      const newRoom = { id: roomData.id, name: roomData.name };
      setRooms(prevRooms => {
        const roomExists = prevRooms.find(room => room.id === roomData.id);
        if (!roomExists) {
          return [...prevRooms, newRoom];
        }
        return prevRooms;
      });
      setIsLoading(false); // FIXED: Reset loading state here
      
      // FIXED: Use timeout here too
      setTimeout(() => {
        changeRoom(roomData.id);
      }, 300);
      
      setJoinRoomId('');
      setShowJoinRoom(false);
    });

    socketRef.current.on('room_not_found', (data) => {
      console.error('Room not found:', data);
      alert('Room not found. Please check the room ID.');
      setIsLoading(false);
    });

    // FIXED: Handle successful room join confirmation
    socketRef.current.on('room_joined', (data) => {
      console.log('Successfully joined room:', data);
      if (data.success && data.roomId) {
        setRoomJoinStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(data.roomId, true);
          return newMap;
        });
        console.log(`Room join confirmed for: ${data.roomId}`);
      }
    });

    socketRef.current.on('room_join_failed', (data) => {
      console.error('Failed to join room:', data);
      alert('Failed to join room: ' + data.error);
      setRoomJoinStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(data.roomId, false);
        return newMap;
      });
    });

    socketRef.current.on('message_failed', (data) => {
      console.error('Message failed:', data);
      alert('Failed to send message: ' + data.error);
      setIsLoading(false);
    });

    socketRef.current.on('messages_cleared', (data) => {
      if (data.roomId === currentRoom) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.room !== data.roomId));
        console.log('Messages cleared for current room');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser]);

  // FIXED: Better room change handling
  useEffect(() => {
    if (currentRoom && isConnected && socketRef.current) {
      console.log('Room changed to:', currentRoom);
      
      // Clear messages immediately when switching rooms
      setMessages(prevMessages => prevMessages.filter(msg => msg.room !== currentRoom));
      setLoadingMessages(true);
      
      // Reset room join status for this room
      setRoomJoinStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(currentRoom, false);
        return newMap;
      });
      
      // Join the room via socket
      console.log('Emitting join_room for:', currentRoom);
      socketRef.current.emit('join_room', { 
        roomId: currentRoom, 
        userId: currentUser.id 
      });
      
      // Load messages after a delay to ensure room join is processed
      const loadMessagesTimeout = setTimeout(async () => {
        try {
          await loadMessages(currentRoom);
        } catch (error) {
          console.error('Error loading messages:', error);
        } finally {
          setLoadingMessages(false);
        }
      }, 800); // FIXED: Increased delay to ensure room join is processed

      return () => {
        clearTimeout(loadMessagesTimeout);
      };
    }
  }, [currentRoom, isConnected, currentUser.id]);

  // Filter messages by current room when displaying
  const currentRoomMessages = messages.filter(message => message.room === currentRoom);

  // Update current room when URL changes
  useEffect(() => {
    if (roomId && roomId !== currentRoom) {
      console.log('URL room changed to:', roomId);
      setCurrentRoom(roomId);
    }
  }, [roomId, currentRoom]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentRoomMessages]);

  // Load messages with better error handling and logging
  const loadMessages = async (roomId) => {
    try {
      console.log('Loading messages for room:', roomId);
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/messages/${roomId}`);
      
      if (response.ok) {
        const messagesData = await response.json();
        console.log(`Messages loaded for room ${roomId}:`, messagesData.length);
        
        // Replace messages for this room
        setMessages(prevMessages => {
          const otherRoomMessages = prevMessages.filter(msg => msg.room !== roomId);
          return [...otherRoomMessages, ...messagesData];
        });
      } else {
        console.error('Failed to load messages:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // FIXED: Enhanced send message with better validation
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || isLoading) return;

    // FIXED: Check if user has successfully joined the current room
    const hasJoinedRoom = roomJoinStatus.get(currentRoom);
    if (!hasJoinedRoom) {
      console.warn('Cannot send message: User has not joined room', currentRoom);
      alert('Please wait for room to load completely before sending messages.');
      return;
    }

    const messageText = newMessage.trim();
    console.log('Sending message to room:', currentRoom, 'Message:', messageText);
    
    setNewMessage(''); // Clear input immediately for better UX
    setIsLoading(true);
    
    try {
      socketRef.current.emit('send_message', {
        text: messageText,
        room: currentRoom
      });
      
      // Set a timeout to reset loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      setIsLoading(false);
    }
  };

  // FIXED: Enhanced change room function
  const changeRoom = (roomId) => {
    if (roomId !== currentRoom && !loadingMessages) {
      console.log('Changing room from', currentRoom, 'to', roomId);
      setCurrentRoom(roomId);
      navigate(`/room/${roomId}`, { replace: true });
      setShowMobileSidebar(false);
    }
  };

  // FIXED: Create room with better state management
  const createRoom = () => {
    if (newRoomName.trim() && isConnected && !isLoading) {
      setIsLoading(true);
      console.log('Creating room:', newRoomName.trim());
      
      socketRef.current.emit('create_room', {
        roomName: newRoomName.trim(),
        userId: currentUser.id
      });
      
      // Set a timeout in case the creation fails silently
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          console.warn('Room creation timeout - resetting loading state');
        }
      }, 10000);
    }
  };

  // FIXED: Join room by ID with better state management
  const joinRoomById = () => {
    if (joinRoomId.trim() && isConnected && !isLoading) {
      setIsLoading(true);
      console.log('Joining room by ID:', joinRoomId.trim());
      
      socketRef.current.emit('get_room_info', joinRoomId.trim());
      
      // Set a timeout in case the join fails silently
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          console.warn('Room join timeout - resetting loading state');
        }
      }, 10000);
    }
  };

  // Clear chat
  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear all messages in this room?')) {
      try {
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
        const response = await fetch(`${serverUrl}/api/messages/${currentRoom}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          // Remove messages for current room only
          setMessages(prevMessages => prevMessages.filter(msg => msg.room !== currentRoom));
          console.log('Chat cleared for room:', currentRoom);
        }
      } catch (error) {
        console.error('Error clearing chat:', error);
        alert('Failed to clear chat. Please try again.');
      }
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Get current room name
  const getCurrentRoomName = () => {
    const room = rooms.find(r => r.id === currentRoom);
    return room ? room.name : currentRoom;
  };

  // FIXED: Better connection and room status indicator
  const getRoomStatus = () => {
    if (!isConnected) return { status: 'disconnected', color: 'red', text: 'Offline' };
    if (loadingMessages) return { status: 'loading', color: 'yellow', text: 'Loading...' };
    if (!roomJoinStatus.get(currentRoom)) return { status: 'joining', color: 'yellow', text: 'Joining...' };
    return { status: 'connected', color: 'green', text: 'Online' };
  };

  const roomStatus = getRoomStatus();

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Overlay */}
      {showMobileSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 
        fixed md:relative z-50 md:z-0 w-64 h-full flex flex-col border-r transition-transform duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              💬 ChatRoom
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                roomStatus.color === 'green' 
                  ? 'bg-green-100 text-green-800' 
                  : roomStatus.color === 'yellow'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  roomStatus.color === 'green' ? 'bg-green-500' : 
                  roomStatus.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span>{roomStatus.text}</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Welcome, {currentUser.name}!
          </div>
        </div>

        {/* Rooms Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Rooms
              </h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => setShowRoomInput(!showRoomInput)}
                  disabled={!isConnected}
                  className={`text-xs p-1 rounded ${
                    isDarkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Create Room"
                >
                  ➕
                </button>
                <button
                  onClick={() => setShowJoinRoom(!showJoinRoom)}
                  disabled={!isConnected}
                  className={`text-xs p-1 rounded ${
                    isDarkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-gray-100'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Join by ID"
                >
                  🔗
                </button>
              </div>
            </div>
            
            {/* Create Room Input */}
            {showRoomInput && (
              <div className="mb-2">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                  placeholder="Room name"
                  disabled={!isConnected || isLoading}
                  className={`w-full px-2 py-1 text-xs rounded border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  } ${!isConnected || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={createRoom}
                  disabled={!newRoomName.trim() || !isConnected || isLoading}
                  className={`w-full mt-1 px-2 py-1 text-xs rounded ${
                    !newRoomName.trim() || !isConnected || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            )}

            {/* Join Room Input */}
            {showJoinRoom && (
              <div className="mb-2">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoomById()}
                  placeholder="Room ID"
                  disabled={!isConnected || isLoading}
                  className={`w-full px-2 py-1 text-xs rounded border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  } ${!isConnected || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={joinRoomById}
                  disabled={!joinRoomId.trim() || !isConnected || isLoading}
                  className={`w-full mt-1 px-2 py-1 text-xs rounded ${
                    !joinRoomId.trim() || !isConnected || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            )}

            {/* Room List */}
            <div className="space-y-1">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => changeRoom(room.id)}
                  disabled={loadingMessages}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentRoom === room.id
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-800'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  } ${loadingMessages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  # {room.name}
                  {loadingMessages && currentRoom === room.id && (
                    <span className="ml-2 text-xs">Loading...</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Online Users */}
          <div>
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Online ({onlineUsers.length})
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {onlineUsers.map(user => (
                <div key={user.id} className={`flex items-center px-2 py-1 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="truncate">
                    {user.name}
                    {user.id === currentUser.id && ' (You)'}
                  </span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <div className={`text-sm text-center py-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  No users online
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-xs mb-2 p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Room ID: <span className="font-mono break-all">{currentRoom}</span>
          </div>
          <button
            onClick={clearChat}
            disabled={!isConnected}
            className={`w-full mb-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              !isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            🧹 Clear Chat
          </button>
          <button
            onClick={onLogout}
            className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚪 Exit Room
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Desktop Header */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className={`md:hidden mr-3 p-2 rounded-lg ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ☰
              </button>
              <div>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  # {getCurrentRoomName()}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {onlineUsers.length} member{onlineUsers.length !== 1 ? 's' : ''} online
                </p>
              </div>
            </div>
            <div className={`md:hidden text-xs px-2 py-1 rounded-full ${
              roomStatus.color === 'green' 
                ? 'bg-green-100 text-green-800' 
                : roomStatus.color === 'yellow'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {roomStatus.color === 'green' ? '🟢' : roomStatus.color === 'yellow' ? '🟡' : '🔴'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {loadingMessages ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading messages...</p>
            </div>
          ) : currentRoomMessages.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-4xl mb-2">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            currentRoomMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-2xl ${
                  message.userId === currentUser.id
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  {message.userId !== currentUser.id && (
                    <p className={`text-xs font-semibold mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {message.userName}
                    </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.userId === currentUser.id
                      ? 'text-blue-200'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
                    <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${getCurrentRoomName()}`}
              disabled={!isConnected || isLoading || !roomJoinStatus.get(currentRoom)}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } ${!isConnected || isLoading || !roomJoinStatus.get(currentRoom) ? 'opacity-50 cursor-not-allowed' : ''}`}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading || !isConnected || !roomJoinStatus.get(currentRoom)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                !newMessage.trim() || isLoading || !isConnected || !roomJoinStatus.get(currentRoom)
                  ? isDarkMode 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
          {!isConnected && (
            <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              Disconnected from server. Trying to reconnect...
            </p>
          )}
          {isConnected && !roomJoinStatus.get(currentRoom) && (
            <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Connecting to room... Please wait
            </p>
          )}
          <div className={`text-xs mt-1 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {newMessage.length}/500 characters
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;