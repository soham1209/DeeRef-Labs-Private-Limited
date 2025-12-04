// src/components/ui/Button.jsx
import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle =
    'px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white',
    ghostDark: 'bg-transparent hover:bg-gray-100 text-gray-600',
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
