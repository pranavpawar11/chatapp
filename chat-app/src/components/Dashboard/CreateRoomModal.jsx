import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Lock, Globe, AlertCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

const CreateRoomModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket, createRoom, connected } = useSocket();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use socket to create room for real-time updates
      createRoom({
        name: name.trim(),
        description: description.trim(),
        isPublic
      });

      // Listen for room creation success/failure
      const handleRoomCreated = (data) => {
        console.log('Room created successfully:', data);
        setLoading(false);
        onClose();
        socket.off('room_created', handleRoomCreated);
        socket.off('error', handleError);
      };

      const handleError = (error) => {
        console.error('Room creation failed:', error);
        setError(error.message || 'Failed to create room');
        setLoading(false);
        socket.off('room_created', handleRoomCreated);
        socket.off('error', handleError);
      };

      // Set up temporary listeners for this creation
      socket.on('room_created', handleRoomCreated);
      socket.on('error', handleError);

      // Fallback timeout in case socket events don't fire
      setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Room creation timed out. Please try again.');
          socket.off('room_created', handleRoomCreated);
          socket.off('error', handleError);
        }
      }, 10000); // 10 second timeout

    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Room</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start a new conversation</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Connection Warning */}
          {!connected && (
            <div className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">Not connected to server. Please check your connection.</div>
            </div>
          )}

          {/* Room Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Room Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
              required
              disabled={loading || !connected}
              maxLength={50}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {name.length}/50 characters
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="What's this room about? (optional)"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all duration-200"
              disabled={loading || !connected}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {description.length}/200 characters
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Privacy Settings
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isPublic 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mt-1 text-blue-500"
                  disabled={loading || !connected}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Public</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Anyone can join</p>
                </div>
              </label>

              <label className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                !isPublic 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mt-1 text-blue-500"
                  disabled={loading || !connected}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Private</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Invite only</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !connected || !name.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Use portal to render modal at document root
  return createPortal(modalContent, document.body);
};

export default CreateRoomModal;