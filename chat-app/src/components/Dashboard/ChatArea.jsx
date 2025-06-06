// components/chat/ChatArea.js
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { useSocket } from "../../contexts/SocketContext";
import Message from "./Message";
import EmojiPicker from "./EmojiPicker";
import {
  Paperclip,
  Smile,
  Send,
  Trash2,
  MoreVertical,
  X,
  Upload,
} from "lucide-react";

const ChatArea = ({ room }) => {
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]); // For group chats
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { user } = useAuth();
  const {
    socket,
    sendMessage,
    joinRoom,
    markMessageAsSeen,
    setRoomMessages,
    getRoomMessages,
  } = useSocket();

  // Get messages from socket context
  const messages = getRoomMessages(room?._id);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/messages/${room._id}`);
        setRoomMessages(room._id, response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setLoading(false);
      }
    };

    if (room) {
      fetchMessages();
      joinRoom(room._id);

      // For direct chats, find the other user
      if (room.roomType === "direct") {
        const other = room.members.find((member) => member._id !== user._id);
        setOtherUser(other);
      }
    }

    return () => {
      if (room) {
        // Clear typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };
    // eslint-disable-next-line
  }, [room, socket]);

  useEffect(() => {
    scrollToBottom();

    // Mark messages as seen when chat is open
    if (room && messages.length > 0) {
      markMessagesAsSeen();
    }
    // eslint-disable-next-line
  }, [messages]);

  useEffect(() => {
    if (!socket || !room) return;

    if (room.roomType === "direct") {
      // Listen for typing events in direct chats
      const handleDirectTyping = (data) => {
        if (data.roomId === room._id && data.userId !== user._id) {
          setIsTyping(true);
        }
      };

      const handleDirectStoppedTyping = (data) => {
        if (data.roomId === room._id && data.userId !== user._id) {
          setIsTyping(false);
        }
      };

      socket.on("user_typing_direct", handleDirectTyping);
      socket.on("user_stopped_typing_direct", handleDirectStoppedTyping);

      return () => {
        socket.off("user_typing_direct", handleDirectTyping);
        socket.off("user_stopped_typing_direct", handleDirectStoppedTyping);
      };
    } else {
      // Listen for typing events in group chats
      const handleGroupTyping = (data) => {
        if (data.roomId === room._id && data.userId !== user._id) {
          setTypingUsers((prev) => {
            const existing = prev.find((u) => u.userId === data.userId);
            if (!existing) {
              return [
                ...prev,
                { userId: data.userId, username: data.username },
              ];
            }
            return prev;
          });
        }
      };

      const handleGroupStoppedTyping = (data) => {
        if (data.roomId === room._id && data.userId !== user._id) {
          setTypingUsers((prev) =>
            prev.filter((u) => u.userId !== data.userId)
          );
        }
      };

      socket.on("user_typing", handleGroupTyping);
      socket.on("user_stopped_typing", handleGroupStoppedTyping);

      return () => {
        socket.off("user_typing", handleGroupTyping);
        socket.off("user_stopped_typing", handleGroupStoppedTyping);
      };
    }
  }, [socket, room, user]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setFileUploading(true);
    setSelectedFile(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        // Send message with file
        const messageData = {
          content: newMessage.trim(),
          roomId: room._id,
          receiverId: room.roomType === "direct" ? otherUser?._id : null,
          messageType: file.type.startsWith("image/") ? "image" : "file",
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName,
          fileSize: response.data.fileSize,
        };

        sendMessage(messageData);
        setNewMessage("");
        setSelectedFile(null);
        handleTypingStop();

        // Clear typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setFileUploading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" && !selectedFile) return;

    if (selectedFile) {
      handleFileUpload(selectedFile);
      return;
    }

    const messageData = {
      content: newMessage,
      roomId: room._id,
      receiverId: room.roomType === "direct" ? otherUser?._id : null,
    };

    sendMessage(messageData);
    setNewMessage("");
    handleTypingStop();

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    // Typing indicator
    if (e.target.value.trim() !== "") {
      handleTypingStart();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000);
    } else {
      handleTypingStop();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      // Reset textarea height
      e.target.style.height = "auto";
    }
  };

  const handleTypingStart = () => {
    if (!room) return;

    if (room.roomType === "direct") {
      socket.emit("typing_start_direct", {
        roomId: room._id,
        userId: user._id,
      });
    } else {
      // Group chat typing logic
      socket.emit("typing_start", {
        roomId: room._id,
        userId: user._id,
        username: user.username,
      });
    }
  };

  const handleTypingStop = () => {
    if (!room) return;

    if (room.roomType === "direct") {
      socket.emit("typing_stop_direct", {
        roomId: room._id,
        userId: user._id,
      });
    } else {
      // Group chat typing logic
      socket.emit("typing_stop", {
        roomId: room._id,
        userId: user._id,
        username: user.username,
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const markMessagesAsSeen = async () => {
    try {
      // Mark unread messages as seen
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId._id !== user._id
      );

      if (unreadMessages.length > 0) {
        try {
          await axios.put(`/messages/group/${room._id}/read`);

          unreadMessages.forEach((msg) => {
            markMessageAsSeen(msg._id, room._id);
          });
        } catch (error) {
          console.error("Failed to mark messages as seen:", error);
        }
      }
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  };

  const handleClearChat = async () => {
    if (!room) return;

    const confirmed = window.confirm(
      `Are you sure you want to clear this ${
        room.roomType === "direct" ? "chat" : "group chat"
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Use unified endpoint
      await axios.delete(`/messages/${room._id}/clear`);
      setRoomMessages(room._id, []);
      setShowActions(false);
    } catch (error) {
      console.error("Failed to clear chat:", error);
      if (error.response?.data?.error === "Only admins can clear group chat") {
        alert("Only admins can clear group chat");
      }
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "a long time ago";
    const now = new Date();
    const diff = (now - new Date(lastSeen)) / 1000;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(lastSeen).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const renderTypingIndicator = () => {
    if (room.roomType === "direct") {
      return (
        isTyping && (
          <div className="px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {otherUser?.username} is typing...
              </span>
            </div>
          </div>
        )
      );
    } else {
      // Group chat typing indicator
      if (typingUsers.length === 0) return null;

      let typingText = "";
      if (typingUsers.length === 1) {
        typingText = `${typingUsers[0].username} is typing...`;
      } else if (typingUsers.length === 2) {
        typingText = `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
      } else {
        typingText = `${typingUsers[0].username} and ${
          typingUsers.length - 1
        } others are typing...`;
      }

      return (
        <div className="px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {typingText}
            </span>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Chat header */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {room.roomType === "direct" && otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={otherUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {(room.roomType === "direct"
                    ? otherUser?.username
                    : room.name
                  )
                    ?.charAt(0)
                    ?.toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {room.roomType === "direct" ? otherUser?.username : room.name}
              </h2>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    room.roomType === "direct"
                      ? otherUser?.isOnline
                        ? "bg-green-500"
                        : "bg-gray-400"
                      : "bg-blue-500"
                  }`}
                ></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {room.roomType === "direct"
                    ? otherUser?.isOnline
                      ? "Online"
                      : `Last seen ${formatLastSeen(otherUser?.lastSeen)}`
                    : `${room.members.length} members`}
                </p>
              </div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {room.roomType === "direct" ? (
                  <button
                    onClick={handleClearChat}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear Chat</span>
                  </button>
                ) : room.roomType === "group" ? (
                  room.admins.includes(user._id) ? (
                    <button
                      onClick={handleClearChat}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear Chat</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 text-left text-gray-500 dark:text-gray-400 cursor-not-allowed flex items-center space-x-2 z-2 ">
                      <Trash2 className="h-4 w-4" />
                      <div>
                        <div className="text-sm">Clear Chat</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Only admins can clear group chats
                        </div>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area with enhanced styling */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white font-bold">
                  {(room.roomType === "direct"
                    ? otherUser?.username
                    : room.name
                  )
                    ?.charAt(0)
                    ?.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {room.roomType === "direct"
                  ? `Start chatting with ${otherUser?.username}`
                  : "Welcome to the group!"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {room.roomType === "direct"
                  ? "Send your first message to begin the conversation"
                  : "No messages yet. Start the conversation!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <Message
                key={message._id || message.id}
                message={message}
                isCurrentUser={message.senderId._id === user._id}
                showStatus={room.roomType === "direct"} // Only show for direct
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {renderTypingIndicator()}

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <Upload className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Message input */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-end bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow relative">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={fileUploading}
            className="p-4 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50  hover:dark:text-gray-600"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <div className="flex-1 max-h-32 overflow-y-auto">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={fileUploading}
              className="w-full py-3 px-0 border-0 resize-none focus:ring-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 disabled:opacity-50"
              rows={1}
              style={{ minHeight: "24px", maxHeight: "120px" }}
            />
          </div>

          {/* Emoji picker button */}
          <div className="relative">
            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Add emoji"
            >
              <span className="text-lg">
                <Smile />
              </span>
            </button>

            {/* Emoji Picker */}
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={handleEmojiSelect}
              position="bottom-right" // or "bottom-left", "top-right", "top-left"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={
              (newMessage.trim() === "" && !selectedFile) || fileUploading
            }
            className={`m-2 p-2.5 rounded-full transition-all duration-200 ${
              (newMessage.trim() === "" && !selectedFile) || fileUploading
                ? "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:scale-105 shadow-md hover:shadow-lg"
            }`}
          >
            {fileUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
