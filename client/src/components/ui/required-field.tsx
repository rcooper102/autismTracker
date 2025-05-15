import React from 'react';

interface RequiredFieldProps {
  children: React.ReactNode;
}

export function RequiredField({ children }: RequiredFieldProps) {
  return (
    <span className="flex items-center">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </span>
  );
}