// src/components/layout/Sidebar.jsx
import React from "react";
import { Hash, Plus, Menu, Lock } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";

const Sidebar = ({
  channels,
  activeChannelId,
  onChangeChannel,
  onCreateChannel,
  currentUser,
  users,
}) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Workspace Header */}
      <div className="h-14 border-b border-slate-800 flex items-center px-4 justify-between hover:bg-slate-800 transition-colors cursor-pointer">
        <h1 className="font-bold text-white truncate">
          DeeRef Labs Private Limited
        </h1>
        <div className="w-8 h-8 p-5 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">
          DLPL
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between group mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition-colors">
              Channels
            </h2>

            <Button
              variant="ghostDark"
              className="text-xs px-3 py-1 bg-blue-900"
              onClick={onCreateChannel}
            >
              Create Channel
            </Button>
          </div>

          <ul className="space-y-0.5">
            {channels.map((channel) => (
              <li key={channel.id}>
                <button
                  onClick={() => onChangeChannel(channel.id)}
                  className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors group ${
                    activeChannelId === channel.id
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {channel.isPrivate ? (
                    <Lock
                      size={16}
                      className={`mr-2 ${
                        activeChannelId === channel.id
                          ? "text-indigo-200"
                          : "text-slate-500"
                      }`}
                    />
                  ) : (
                    <Hash
                      size={16}
                      className={`mr-2 ${
                        activeChannelId === channel.id
                          ? "text-indigo-200"
                          : "text-slate-500"
                      }`}
                    />
                  )}
                  <span className="truncate flex-1 text-left">
                    {channel.name}
                  </span>
                  {channel.unread > 0 && activeChannelId !== channel.id && (
                    <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[1.2rem] text-center">
                      {channel.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 bg-slate-950/50 flex items-center gap-3">
        <div className="relative">
          <Avatar name={currentUser.name} size="sm" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentUser.name}
          </p>
          <p className="text-xs text-slate-500 truncate">Online</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
