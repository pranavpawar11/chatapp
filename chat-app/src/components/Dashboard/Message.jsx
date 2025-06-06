import React from "react";
import { format } from "date-fns";
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  Image,
  Video,
  Clock,
} from "lucide-react";

const Message = ({ message, isCurrentUser, currentUserId }) => {
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="h-4 w-4" />;

    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return <Image className="h-4 w-4" />;
    }
    if (["mp4", "webm", "ogg", "avi"].includes(extension)) {
      return <Video className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const renderMessageStatus = () => {
    if (!isCurrentUser) return null;

    // console.log("Status:", message.status);
    let status = message.status;
    if (message.isRead && !status) status = "seen";

    const statusConfig = {
      pending: {
        icon: <Clock className="h-3.5 w-3.5" />,
        color: "text-gray-300",
        bgColor: "bg-black/10",
        label: "Sending",
      },
      sent: {
        icon: <Check className="h-3.5 w-3.5" />,
        color: "text-gray-200",
        bgColor: "bg-black/15",
        label: "Sent",
      },
      delivered: {
        icon: <CheckCheck className="h-3.5 w-3.5" />,
        color: "text-gray-100",
        bgColor: "bg-black/20",
        label: "Delivered",
      },
      seen: {
        icon: <CheckCheck className="h-3.5 w-3.5" />,
        color: "text-emerald-300",
        bgColor: "bg-emerald-500/20",
        label: "Seen",
      },
    };

    const config = statusConfig[message.status] || statusConfig.sent;

    return (
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full ${config.bgColor} ${config.color} transition-all duration-200 hover:scale-110`}
        title={config.label}
      >
        {config.icon}
      </div>
    );
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

  return (
    <div
      className={`flex mb-6 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-md lg:max-w-lg`}
      >
        {/* Sender name for group chats when not current user */}
        {!isCurrentUser && message.senderId && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 ml-4 px-1">
            {message.senderId.username}
          </span>
        )}

        <div
          className={`relative px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
            isCurrentUser
              ? "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl rounded-br-lg ml-auto"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-lg border border-gray-200 dark:border-gray-700"
          }`}
        >
          {/* Message content */}
          {message.messageType === "text" ? (
            <p className="leading-relaxed break-words whitespace-pre-wrap text-[15px]">
              {message.content}
            </p>
          ) : (
            <div className="space-y-3">
              {message.content && (
                <p className="leading-relaxed break-words whitespace-pre-wrap text-[15px]">
                  {message.content}
                </p>
              )}
              <div
                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                  isCurrentUser
                    ? "bg-white/15 backdrop-blur-sm border-white/25 hover:bg-white/20"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg ${
                    isCurrentUser
                      ? "bg-white/15"
                      : "bg-blue-50 dark:bg-blue-900/30"
                  }`}
                >
                  {getFileIcon(message.fileName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isCurrentUser
                        ? "text-white"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {message.fileName || "Unnamed file"}
                  </p>
                  {message.fileSize && (
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatFileSize(message.fileSize)}
                    </p>
                  )}
                </div>
                {message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 ${
                      isCurrentUser
                        ? "hover:bg-white/25 text-white"
                        : "hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                    }`}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timestamp and status container */}
          <div
            className={`flex items-center justify-between mt-3 pt-2 ${
              isCurrentUser
                ? "border-t border-white/20"
                : "border-t border-gray-200/50 dark:border-gray-600/50"
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isCurrentUser
                  ? "text-white/80"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {format(new Date(message.timestamp), "HH:mm")}
            </span>

            {/* Status indicator with better spacing */}
            <div className="ml-3">{renderMessageStatus()}</div>
          </div>

          {/* Enhanced message tail/pointer */}
          <div
            className={`absolute bottom-0 w-4 h-4 ${
              isCurrentUser
                ? "right-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-bl-full -mr-2 shadow-md"
                : "left-0 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 rounded-br-full -ml-2 shadow-md"
            }`}
          />
        </div>

        {/* Deleted message indicator */}
        {message.isDeleted && (
          <div
            className={`text-xs italic mt-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 inline-block self-start ${
              isCurrentUser ? "text-right self-end" : "text-left self-start"
            } text-gray-500 dark:text-gray-400`}
          >
            🗑️ This message was deleted
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
