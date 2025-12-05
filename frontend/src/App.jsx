// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { createSocket } from "./realtime/socketClient.js";
import { Menu } from "lucide-react";

import AuthScreen from "./components/auth/AuthScreen.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ChatArea from "./components/chat/ChatArea.jsx";
import RightSidebar from "./components/layout/RightSidebar.jsx";
import Modal from "./components/ui/Modal.jsx";
import Button from "./components/ui/Button.jsx";

import { USERS } from "./data/mockData.js"; // keep just for display
import { getMe } from "./api/authApi.js";
import {
  fetchChannels,
  createChannelApi,
  joinChannelApi,
  leaveChannelApi,
} from "./api/channelApi.js";
import { fetchChannelMessages, sendChannelMessage } from "./api/messageApi.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);

  const [messagesByChannel, setMessagesByChannel] = useState({});
  const [messageMeta, setMessageMeta] = useState({}); // { [channelId]: { hasMore, nextCursor, isLoadingMore } }

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [typingUsersByChannel, setTypingUsersByChannel] = useState({});

  // Auto-login: check token -> /me -> /channels
  useEffect(() => {
    const token = localStorage.getItem("teamsync_token");
    if (!token) {
      setAuthChecking(false);
      return;
    }

    (async () => {
      try {
        const data = await getMe();
        setUser(data.user);

        // Load channels
        const ch = await fetchChannels();
        setChannels(ch);
        if (ch.length > 0) {
          setActiveChannelId(ch[0].id);
          await loadMessagesForChannel(ch[0].id, { replace: true });
        }
      } catch (err) {
        console.error("Auto-login failed:", err);
        localStorage.removeItem("teamsync_token");
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  // Socket.io setup
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem("teamsync_token");
    if (!token) return;

    const s = createSocket(token);
    setSocket(s);

    s.on("connect", () => {
      console.log("Socket connected:", s.id);
    });

    s.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    s.on("onlineUsers", (list) => {
      setOnlineUsers(list);
    });

    s.on("newMessage", ({ channelId, message }) => {
      console.log("newMessage from socket:", channelId, message);
      setMessagesByChannel((prev) => {
        const existing = prev[channelId] || [];

        if (existing.some((m) => m.id === message.id)) {
          return prev;
        }

        return {
          ...prev,
          [channelId]: [...existing, message],
        };
      });
    });
    s.on("userTyping", ({ channelId, user: typingUser }) => {
      if (!typingUser || typingUser.id === user.id) return; // ignore myself

      setTypingUsersByChannel((prev) => {
        const existing = prev[channelId] || [];
        if (existing.some((u) => u.id === typingUser.id)) return prev;

        return {
          ...prev,
          [channelId]: [...existing, typingUser],
        };
      });
    });

    s.on("userStopTyping", ({ channelId, userId }) => {
      if (!userId || userId === user.id) return;

      setTypingUsersByChannel((prev) => {
        const existing = prev[channelId] || [];
        const updated = existing.filter((u) => u.id !== userId);
        return {
          ...prev,
          [channelId]: updated,
        };
      });
    });

    return () => {
      s.off("onlineUsers");
      s.off("newMessage");
      s.off("userTyping");
      s.off("userStopTyping");
      s.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket || !activeChannelId) return;

    console.log("Joining channel room", activeChannelId);
    socket.emit("joinChannel", activeChannelId);

    // optional: leave when channel changes
    return () => {
      console.log("Leaving channel room", activeChannelId);
      socket.emit("leaveChannel", activeChannelId);
    };
  }, [socket, activeChannelId]);

  const prevChannelRef = useRef(null);

  // Handle joining & leaving channels on socket when activeChannelId changes
  useEffect(() => {
    if (!socket || !activeChannelId) return;

    const prev = prevChannelRef.current;
    if (prev && prev !== activeChannelId) {
      socket.emit("leaveChannel", prev);
    }

    socket.emit("joinChannel", activeChannelId);
    prevChannelRef.current = activeChannelId;
  }, [socket, activeChannelId]);

  // When user logs in manually via AuthScreen
  const handleLoggedIn = async (loggedInUser) => {
    setUser(loggedInUser);
    setAuthChecking(false);

    try {
      const ch = await fetchChannels();
      setChannels(ch);
      if (ch.length > 0) {
        setActiveChannelId(ch[0].id);
        await loadMessagesForChannel(ch[0].id, { replace: true });
      }
    } catch (err) {
      console.error("Failed to load channels after login:", err);
    }
  };

  // Helper to load messages for specific channel
  const loadMessagesForChannel = async (
    channelId,
    { before, replace = false } = {}
  ) => {
    try {
      setMessageMeta((prev) => ({
        ...prev,
        [channelId]: {
          ...(prev[channelId] || {}),
          isLoadingMore: true,
        },
      }));

      const meta = messageMeta[channelId];
      const cursorToUse = before || meta?.nextCursor || undefined;

      const { messages, hasMore, nextCursor } = await fetchChannelMessages(
        channelId,
        {
          limit: 20,
          before: cursorToUse,
        }
      );

      setMessagesByChannel((prev) => {
        const existing = prev[channelId] || [];
        let updated;

        if (replace || existing.length === 0 || !cursorToUse) {
          
          updated = messages;
        } else {
          
          updated = [...messages, ...existing];
        }

        return {
          ...prev,
          [channelId]: updated,
        };
      });

      setMessageMeta((prev) => ({
        ...prev,
        [channelId]: {
          hasMore,
          nextCursor,
          isLoadingMore: false,
        },
      }));
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessageMeta((prev) => ({
        ...prev,
        [channelId]: {
          ...(prev[channelId] || {}),
          isLoadingMore: false,
        },
      }));
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (text) => {
    if (!activeChannelId) return;

    try {
      const msg = await sendChannelMessage(activeChannelId, text);
      setMessagesByChannel((prev) => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), msg],
      }));

      if (socket) {
        socket.emit("sendMessage", {
          channelId: activeChannelId,
          message: msg, // { id, userId, text, timestamp }
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Create channel (backend)
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const newChannel = await createChannelApi({
        name: newChannelName.toLowerCase().replace(/\s+/g, "-"),
        description: newChannelDescription,
        isPrivate: newChannelPrivate,
      });

      setChannels((prev) => [...prev, newChannel]);
      setActiveChannelId(newChannel.id);

      setMessagesByChannel((prev) => ({ ...prev, [newChannel.id]: [] }));
      setMessageMeta((prev) => ({
        ...prev,
        [newChannel.id]: {
          hasMore: false,
          nextCursor: null,
          isLoadingMore: false,
        },
      }));

      setIsModalOpen(false);
      setNewChannelName("");
      setNewChannelDescription("");
      setNewChannelPrivate(false);
    } catch (err) {
      console.error("Create channel failed:", err);
    }
  };

  // When channel changes
  const handleChangeChannel = async (id) => {
    setActiveChannelId(id);

    const alreadyLoaded =
      messagesByChannel[id] && messagesByChannel[id].length > 0;
    if (!alreadyLoaded) {
      await loadMessagesForChannel(id, { replace: true });
    }
  };
  // Join channel
  const handleJoinChannel = async (channelId) => {
    try {
      const updated = await joinChannelApi(channelId);

      // update channels list with new members array
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? updated : c))
      );

      // reload messages (in case backend restricts non-members later)
      await loadMessagesForChannel(channelId, { replace: true });
    } catch (err) {
      console.error("Join channel failed:", err);
    }
  };

  // Leave channel
  const handleLeaveChannel = async (channelId) => {
    try {
      const updated = await leaveChannelApi(channelId);

      // update that channel in list (members changed)
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? updated : c))
      );

      // optional: clear messages locally or keep as readonly
      setMessagesByChannel((prev) => ({
        ...prev,
        [channelId]: prev[channelId] || [],
      }));
    } catch (err) {
      console.error("Leave channel failed:", err);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLoggedIn} />;
  }

  const activeChannel = channels.find((c) => c.id === activeChannelId) ||
    channels[0] || { id: "", name: "", description: "", members: [] };

  const isMember =
    activeChannel &&
    Array.isArray(activeChannel.members) &&
    activeChannel.members.some((m) => m === user.id || m?._id === user.id);

  // extract member IDs
  const channelMemberIds = Array.isArray(activeChannel.members)
    ? activeChannel.members.map((m) =>
        typeof m === "string" ? m : m._id?.toString()
      )
    : [];

  // members count
  const channelMemberCount = channelMemberIds.length;

  // online users in this channel only
  const channelOnlineUsers = onlineUsers.filter((u) =>
    channelMemberIds.includes(u.id)
  );

  const currentMessages = messagesByChannel[activeChannelId] || [];
  const currentMeta = messageMeta[activeChannelId] || {
    hasMore: false,
    nextCursor: null,
    isLoadingMore: false,
  };

  const typingUsers = typingUsersByChannel[activeChannelId] || [];

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Mobile Menu Button (not wired yet) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="secondary" className="!p-2 shadow-lg">
          <Menu size={20} />
        </Button>
      </div>

      <Sidebar
        currentUser={user}
        channels={channels}
        activeChannelId={activeChannelId}
        onChangeChannel={handleChangeChannel}
        onCreateChannel={() => setIsModalOpen(true)}
        users={USERS}
      />

      <ChatArea
        channel={activeChannel}
        messages={currentMessages}
        currentUserId={user.id}
        onSendMessage={handleSendMessage}
        users={onlineUsers}
        onLoadOlder={() => loadMessagesForChannel(activeChannel.id)}
        hasMore={currentMeta.hasMore}
        isLoadingMore={currentMeta.isLoadingMore}
        isMember={isMember}
        onJoinChannel={() => handleJoinChannel(activeChannel.id)}
        onLeaveChannel={() => handleLeaveChannel(activeChannel.id)}
        socket={socket}
        typingUsers={typingUsers}
      />

      <RightSidebar
        channel={activeChannel}
        onlineUsers={channelOnlineUsers}
        memberCount={channelMemberCount}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create a Channel"
      >
        <form onSubmit={handleCreateChannel}>
          <p className="text-gray-500 text-sm mb-4">
            Channels are where your team communicates. Give it a clear name and
            description.
          </p>

          {/* CHANNEL NAME */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">#</span>
              <input
                autoFocus
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. marketing-team"
              />
            </div>
          </div>

          {/* CHANNEL DESCRIPTION */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="Describe what this channel is for..."
            />
          </div>
          {/* Make channel private */}
          <div className="mt-2 flex items-start gap-2">
            <input
              id="new-channel-private"
              type="checkbox"
              checked={newChannelPrivate}
              onChange={(e) => setNewChannelPrivate(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label
              htmlFor="new-channel-private"
              className="text-sm text-gray-700"
            >
              <span className="font-semibold">Make private</span>
              <span className="block text-xs text-gray-500">
                Only invited members can see and join this channel.
              </span>
            </label>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="ghostDark"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!newChannelName.trim()}>
              Create Channel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
