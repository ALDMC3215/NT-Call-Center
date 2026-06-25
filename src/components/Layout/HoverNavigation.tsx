import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../hooks/useLocale';
import { Phone, Users, User, ShieldBan, Settings2 } from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';

export const HoverNavigation = () => {
  const { tr, direction } = useLocale();
  const { currentView, setCurrentView } = useAppContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const menuItems = [
    { id: 'dashboard', icon: Phone, label: tr('تماس‌ها', 'Calls') },
    { id: 'admin', icon: Users, label: tr('کاربران', 'Users') },
    { id: 'blacklist', icon: ShieldBan, label: tr('لیست سیاه', 'Blacklist') },
    { id: 'profile', icon: User, label: tr('پروفایل', 'Profile') },
    { id: 'settings', icon: Settings2, label: tr('تنظیمات', 'Settings') },
  ];

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto h-24 px-12 flex items-start justify-center gap-3"
      onMouseLeave={() => setHoveredIndex(null)}
      dir={direction}
    >
      <div className="flex items-center justify-center gap-3 h-[64px]">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          const isHovered = hoveredIndex === index;
          const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1;

          // Dock magnification sizes
          const size = isHovered ? 64 : isNeighbor ? 56 : 46;
          
          return (
            <motion.button
              key={item.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => setCurrentView(item.id as any)}
              animate={{ 
                width: size, 
                height: size,
                opacity: hoveredIndex !== null && !isHovered && !isNeighbor ? 0.5 : 1,
                y: isHovered ? -8 : isNeighbor ? -4 : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`
                relative flex items-center justify-center rounded-full transition-colors shrink-0
                ${isActive 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-brand-500/50 ' 
                  : 'bg-slate-200 text-secondary border border-border '}
              `}
            >
              <Icon size={size * 0.45} />
              
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -bottom-12 whitespace-nowrap px-3 py-1.5 rounded-lg bg-surface  border border-border text-[11px] font-medium tracking-wider text-white  pointer-events-none"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
