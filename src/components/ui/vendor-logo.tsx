import React from 'react';
import Image from 'next/image';

interface VendorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const VendorLogo: React.FC<VendorLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    '3xl': 'w-48 h-48',
    '4xl': 'w-64 h-64'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src="/logo.png"
        alt="vendors.gg Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
};

export default VendorLogo;