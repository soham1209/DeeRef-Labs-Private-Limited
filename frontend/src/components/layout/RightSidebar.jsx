// src/components/layout/RightSidebar.jsx
import React from 'react';

const RightSidebar = ({ channel, onlineUsers, memberCount }) => {
  const channelName = channel?.name || 'channel';
  const description =
    channel?.description ||
    'No description has been set for this channel yet.';

  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 hidden lg:flex flex-col h-full">
      {/* About / Channel info */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
          About #{channelName}
        </h3>
        <p className="text-xs text-gray-500 mt-2">{description}</p>

        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <div>
            <span className="block font-bold text-gray-900">
              {memberCount}
            </span>
            <span>Members</span>
          </div>
          <div>
            <span className="block font-bold text-green-600">
              {onlineUsers.length}
            </span>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Online users list (only members of this channel) */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-4">
          Online — {onlineUsers.length}
        </h3>
        <ul className="space-y-3">
          {onlineUsers.map((user) => (
            <li key={user.id} className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <img
                  src={user.avatar}
                  className="w-8 h-8 rounded-md bg-gray-200"
                  alt={user.name}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-50 bg-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 truncate transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Member of #{channelName}
                </p>
              </div>
            </li>
          ))}

          {onlineUsers.length === 0 && (
            <p className="text-xs text-gray-400">
              No members of this channel are online right now.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RightSidebar;
