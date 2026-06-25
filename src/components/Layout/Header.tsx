import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { HeaderTabs } from './HeaderTabs';
import { Z } from '../../constants/zIndex';

export const Header = () => {
  const { profile, setCurrentView } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 72) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!profile) return null;

  return (
    <header className={`flex items-center fixed top-0 left-0 right-0 w-full bg-[#fffcfb] border-b border-border transition-all duration-300 ease-out ${isVisible ? '' : '-translate-y-full'}`} style={{ zIndex: Z.HEADER, height: '62px' }}>
      <div className="w-full mx-auto flex items-center justify-between relative">
        <HeaderTabs />
      </div>
    </header>
  );
};
