import React from 'react';

interface RichTextContentProps {
  content: string;
  className?: string;
}

const RichTextContent: React.FC<RichTextContentProps> = ({ content, className = '' }) => {
  // This component renders HTML content safely
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
};

export default RichTextContent;