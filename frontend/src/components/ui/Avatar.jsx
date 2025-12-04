// src/components/ui/Avatar.jsx
import React from 'react';

const Avatar = ({ url, name, size = 'md', status }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-9 h-9', lg: 'w-12 h-12' };

  return (
    <div className="relative inline-block">
      <img
        src={url || `https://ui-avatars.com/api/?name=${name}&background=random`}
        alt={name}
        className={`${sizes[size]} rounded-md object-cover bg-gray-200`}
      />
      {status && (
        <span
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
            status === 'online' ? 'bg-emerald-500' : status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
};

export default Avatar;
