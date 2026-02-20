import React from 'react';
import { cn } from '@/lib/utils';
import logoRed from '@/assets/agsell-logo-red.png';
import logoFull from '@/assets/agsell-logo-full.png';
import logoWhite from '@/assets/logo-white.png';
import logoBlack from '@/assets/logo-black.png';
import logoAlternativo from '@/assets/logo-alternativo.png';

interface LogoProps {
  variant?: 'red' | 'white' | 'black' | 'alternativo' | 'full' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
}

const iconSizeMap = {
  xs: 'h-5 w-5',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
  '2xl': 'h-16 w-16',
};

const fullLogoSizeMap = {
  xs: 'h-5 w-auto',
  sm: 'h-6 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-10 w-auto',
  xl: 'h-12 w-auto',
  '2xl': 'h-16 w-auto',
};

export function Logo({ 
  variant = 'auto', 
  size = 'md', 
  className,
  showText = false 
}: LogoProps) {
  // When showText is true, use the full logo with integrated text
  if (showText) {
    return (
      <img 
        src={logoFull} 
        alt="AG Sell" 
        className={cn(fullLogoSizeMap[size], 'object-contain', className)}
      />
    );
  }

  const getLogoSrc = () => {
    switch (variant) {
      case 'red':
        return logoRed;
      case 'white':
        return logoWhite;
      case 'black':
        return logoBlack;
      case 'alternativo':
        return logoAlternativo;
      case 'full':
        return logoFull;
      case 'auto':
      default:
        // Auto mode: use red logo for better contrast on light backgrounds
        return logoRed;
    }
  };

  return (
    <img 
      src={getLogoSrc()} 
      alt="AG Sell" 
      className={cn(iconSizeMap[size], 'object-contain', className)}
    />
  );
}

// Icon-only version for compact spaces
export function LogoIcon({ 
  variant = 'red', 
  size = 'md', 
  className 
}: Omit<LogoProps, 'showText'>) {
  const getLogoSrc = () => {
    switch (variant) {
      case 'red':
        return logoRed;
      case 'white':
        return logoWhite;
      case 'black':
        return logoBlack;
      case 'alternativo':
        return logoAlternativo;
      case 'full':
        return logoFull;
      default:
        return logoRed;
    }
  };

  return (
    <img 
      src={getLogoSrc()} 
      alt="AG Sell" 
      className={cn(iconSizeMap[size], 'object-contain', className)}
    />
  );
}
