import React from 'react';
import Image from 'next/image';

interface VendorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const VendorLogo: React.FC<VendorLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
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