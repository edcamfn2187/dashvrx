
import React, { useEffect, useState } from 'react';

interface ISHLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ISHLogo: React.FC<ISHLogoProps> = ({ size = 'md', className = '' }) => {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('custom_app_logo');
    setCustomLogo(savedLogo);

    // Listener para mudanças no localStorage (caso mude em outra aba ou via componente de settings)
    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('custom_app_logo'));
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event para quando mudarmos na mesma aba
    window.addEventListener('logoUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logoUpdated', handleStorageChange);
    };
  }, []);

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizes[size]} bg-white rounded-xl flex items-center justify-center p-1 shadow-md border border-gray-200/50 overflow-hidden ${className}`}>
      {customLogo ? (
        <img src={customLogo} alt="Custom Logo" className="max-w-full max-h-full object-contain" />
      ) : (
        <div className="relative flex items-center justify-center w-full h-full">
          <span className="text-[#0a2540] font-[900] text-[1.4em] tracking-tighter italic flex leading-none mt-1">
            ISH
          </span>
          <div className="absolute -right-0.5 bottom-1.5 text-cyan-500 drop-shadow-sm">
            <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISHLogo;
