import { CSSProperties } from 'react';
import defaultLogoSrc from '@/assets/brain-cog-logo.svg';
import whiteLogoSrc from '@/assets/brain-cog-logo-white.svg';

interface LogoProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  variant?: 'default' | 'white';
}

export function Logo({ 
  size = 24, 
  className = "", 
  style, 
  alt = "AutiTrack Logo",
  variant = 'default' 
}: LogoProps) {
  const logoSrc = variant === 'white' ? whiteLogoSrc : defaultLogoSrc;
  
  return (
    <img 
      src={logoSrc} 
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        ...style,
      }}
    />
  );
}