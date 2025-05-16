import { CSSProperties } from 'react';
import logoSrc from '@/assets/brain-cog-logo.svg';

interface LogoProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function Logo({ size = 24, className = "", style, alt = "AutiTrack Logo" }: LogoProps) {
  return (
    <img 
      src={logoSrc} 
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        ...style,
        color: 'currentColor' // Ensures the SVG inherits the text color
      }}
    />
  );
}