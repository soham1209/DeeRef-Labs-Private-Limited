// src/components/chat/ChatArea.jsx
import React, { useState, useEffect, useRef } from "react";
import { Hash, Paperclip, Plus, Send } from "lucide-react";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";

const ChatArea = ({
  channel,
  messages,
  currentUserId,
  onSendMessage,
  users,
  onLoadOlder,
  hasMore,
  isLoadingMore,
  isMember = true,
  onJoinChannel,
  onLeaveChannel,
  socket,
  typingUsers = [],
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [localLoading, setLocalLoading] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages / channel change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, channel.id]);

  const handleScroll = async (e) => {
    if (!onLoadOlder || !hasMore || isLoadingMore || localLoading) return;

    if (e.target.scrollTop === 0) {
      try {
        setLocalLoading(true);
        await onLoadOlder();
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const emitStopTyping = () => {
    if (!socket || !channel?.id) return;
    socket.emit("stopTyping", { channelId: channel.id });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText("");

    if (isTyping) {
      emitStopTyping();
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

  const getUserById = (id) =>
    users.find((u) => u.id === id) || { name: "Unknown", avatar: "" };

  // pass latest text so we don't rely on stale state
  const handleTypingActivity = (text) => {
    if (!socket || !channel?.id || !isMember) return;

    const trimmed = text.trim();

    if (!trimmed) {
      if (isTyping) {
        emitStopTyping();
        setIsTyping(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    if (!isTyping) {
      socket.emit("typing", { channelId: channel.id });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        emitStopTyping();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTopLoader = hasMore && (isLoadingMore || localLoading);

  return (
    <div className="flex-1 flex flex-col h-full bg-white min-w-0">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Hash size={20} className="text-gray-400" />
            {channel.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {channel.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isMember ? (
            channel.isPrivate ? (
              <span className="text-xs text-gray-500">
                This is a <span className="font-semibold">private</span> channel.
              </span>
            ) : (
              <Button
                variant="secondary"
                className="text-xs px-3 py-1"
                onClick={onJoinChannel}
              >
                Join channel
              </Button>
            )
          ) : (
            <Button
              variant="ghostDark"
              className="text-xs px-3 py-1"
              onClick={onLeaveChannel}
            >
              Leave
            </Button>
          )}
          {/* you can add avatars here if you want */}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
      >
        {showTopLoader && isMember && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isMember ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            <div className="text-center max-w-sm">
              {channel.isPrivate ? (
                <>
                  <p className="font-semibold mb-2">
                    This is a private channel
                  </p>
                  <p>You must be invited to view or send messages here.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-2">
                    You&apos;re not a member of this channel
                  </p>
                  <p>
                    Click &quot;Join channel&quot; to view and send messages.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMe = msg.userId === currentUserId;
              const user = isMe
                ? { name: "You", avatar: "" }
                : getUserById(msg.userId);
              const prevMsg = messages[index - 1];
              const isSequence =
                prevMsg &&
                prevMsg.userId === msg.userId &&
                new Date(msg.timestamp) - new Date(prevMsg.timestamp) < 300000;

              return (
                <div
                  key={msg.id}
                  className={`group flex gap-3 ${isSequence ? "mt-1" : "mt-4"}`}
                >
                  {!isSequence ? (
                    <div className="flex-shrink-0 pt-1">
                      <Avatar name={user.name} url={user.avatar} size="md" />
                    </div>
                  ) : (
                    <div className="w-9 flex-shrink-0 text-[10px] text-gray-300 text-right opacity-0 group-hover:opacity-100 select-none pt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}

                  <div className="flex-1 max-w-3xl">
                    {!isSequence && (
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-900">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    <div className="text-gray-800 leading-relaxed text-[15px]">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <form onSubmit={handleSend} className="p-2">
            <textarea
              value={inputText}
              onChange={(e) => {
                const value = e.target.value;
                setInputText(value);
                handleTypingActivity(value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isMember
                  ? `Message #${channel.name}`
                  : "Join this channel to start messaging"
              }
              className="w-full max-h-60 min-h-[80px] resize-none focus:outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              rows={1}
              disabled={!isMember}
            />

            <div className="flex justify-between items-center mt-2">
              <Button
                variant="ghost"
                className="!text-gray-400 hover:!text-gray-600 !p-1"
              >
                <Plus size={18} />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Shift + Enter to add a new line
                </span>
                <button
                  type="submit"
                  disabled={!isMember || !inputText.trim()}
                  className={`p-2 rounded-md transition-all ${
                    !isMember
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : inputText.trim()
                      ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {typingUsers.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {typingUsers.length === 1 ? (
                  <span>{typingUsers[0].name} is typing…</span>
                ) : typingUsers.length === 2 ? (
                  <span>
                    {typingUsers[0].name} and {typingUsers[1].name} are typing…
                  </span>
                ) : (
                  <span>Several people are typing…</span>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
