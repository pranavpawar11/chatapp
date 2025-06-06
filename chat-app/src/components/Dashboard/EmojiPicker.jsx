import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const EmojiPicker = ({ isOpen, onClose, onEmojiSelect, position = 'bottom-right' }) => {
  const pickerRef = useRef(null);

  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😊", "😍", "🥰", "😘", "😗", "😙",
    "😚", "🤗", "🤔", "😐", "😑", "😶", "🙄", "😏", "😣", "😥",
    "😮", "🤐", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝",
    "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "🙁", "😖",
    "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯",
    "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "🥴", "😷",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
    "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "👏",
    "🙌", "👐", "🤲", "🙏", "✍️", "💪", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓",
    "💗", "💖", "💘", "💝", "💟", "🔥", "💯", "💢", "💥", "💫",
    "⭐", "🌟", "✨", "⚡", "☄️", "💤", "🎉", "🎊", "🎈", "🎁"
  ];

  const frequentEmojis = ["😀", "😂", "❤️", "👍", "😊", "🎉", "🔥", "💯"];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    onClose();
  };

  // Position classes based on prop
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-full left-0 mb-2';
      case 'bottom-right':
        return 'bottom-full right-0 mb-2';
      case 'top-left':
        return 'top-full left-0 mt-2';
      case 'top-right':
        return 'top-full right-0 mt-2';
      default:
        return 'bottom-full right-0 mb-2';
    }
  };

  return (
    <div
      ref={pickerRef}
      className={`absolute ${getPositionClasses()} bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-200`}
      style={{ 
        width: 'min(320px, calc(100vw - 2rem))',
        maxHeight: '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Choose Emoji
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-3 space-y-4 max-h-80 overflow-y-auto  scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {/* Frequent Emojis */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Frequently Used
          </h4>
          <div className="grid grid-cols-8 gap-1">
            {frequentEmojis.map((emoji, index) => (
              <button
                key={`frequent-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center aspect-square"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* All Emojis */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            All Emojis
          </h4>
          <div className="grid grid-cols-8 gap-1">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center aspect-square"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;