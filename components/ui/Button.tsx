
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`
        px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
        bg-blue-600 hover:bg-blue-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-colors duration-150
        ${className || ''}
      `}
    >
      {children}
    </button>
  );
};
