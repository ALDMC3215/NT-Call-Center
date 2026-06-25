import { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface UseOverlayPositionProps {
  isOpen: boolean;
  onClose: () => void;
  gap?: number;
}

export function useOverlayPosition({ isOpen, onClose, gap = 6 }: UseOverlayPositionProps) {
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width?: number; isTop: boolean }>({
    top: -9999,
    left: 0,
    isTop: false,
  });

  const updatePosition = () => {
    const isMobileNow = window.innerWidth < 640;
    setIsMobile(isMobileNow);

    if (!isOpen || !triggerRef.current || !overlayRef.current) return;
    
    if (isMobileNow) {
      // For mobile bottom-sheet style, we don't need intricate positioning
      // However, we still return safe defaults
      setPosition({
        top: 0,
        left: 0,
        width: window.innerWidth,
        isTop: false
      });
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const overlayHeight = overlayRef.current.offsetHeight;
    const overlayWidth = overlayRef.current.offsetWidth || 250;
    
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const isTop = spaceBelow < overlayHeight + gap && triggerRect.top > overlayHeight + gap;

    let left = triggerRect.right - overlayWidth;

    if (left < 10) left = triggerRect.left;
    if (left + overlayWidth > window.innerWidth - 10) {
      left = window.innerWidth - overlayWidth - 10;
    }
    if (left < 10) left = 10;

    setPosition({
      top: isTop ? triggerRect.top - gap - overlayHeight : triggerRect.bottom + gap,
      left,
      width: triggerRect.width,
      isTop,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      requestAnimationFrame(updatePosition);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return { triggerRef, overlayRef, position, isMobile };
}
