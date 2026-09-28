'use client';

import React, { useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * SpotlightCard Component from @react-bits registry (SpotlightCard-TS-TW)
 * Subtle cursor-driven radial spotlight highlight
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(79, 70, 229, 0.08)',
  onClick,
  style
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.8);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(0.8);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={style}
      className={`relative rounded-2xl border border-slate-200 dark:border-[#2b3745] bg-white dark:bg-[#1c2530] overflow-hidden transition-all duration-200 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-in-out z-10"
        style={{
          opacity,
          background: `radial-gradient(circle 180px at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
