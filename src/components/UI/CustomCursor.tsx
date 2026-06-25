import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

type CursorState = 'default' | 'pointer' | 'text';

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorState, setCursorState] = useState<CursorState>('default');
  
  // Instant tracking for the center dot
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Springy tracking for outer elements
  const springConfig = { damping: 30, stiffness: 800, mass: 0.1 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Even softer spring for the large glow
  const glowSpringConfig = { damping: 40, stiffness: 200, mass: 0.5 };
  const glowXSpring = useSpring(cursorX, glowSpringConfig);
  const glowYSpring = useSpring(cursorY, glowSpringConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Detect interactable elements
      if (e.target instanceof Element) {
        const computedStyle = window.getComputedStyle(e.target);
        const cursor = computedStyle.cursor;
        
        if (cursor === 'pointer' || e.target.closest('a') || e.target.closest('button')) {
          setCursorState('pointer');
        } else if (cursor === 'text' || e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
          setCursorState('text');
        } else {
          setCursorState('default');
        }
      }
    };
    
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  // Define variants for the outer ring depending on state
  const ringVariants = {
    default: {
      scale: 1,
      opacity: 1,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      borderRadius: '50%',
      borderWidth: '2px',
    },
    pointer: {
      scale: 1.5,
      opacity: 0.8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '50%',
      borderWidth: '1px',
    },
    text: {
      scaleX: 0.15,
      scaleY: 1.2,
      opacity: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '2px',
      borderWidth: '0px',
    }
  };

  return (
    <>
      <style>
        {`
          * {
            cursor: none !important;
          }
        `}
      </style>
      
      {/* Outer interactive ring (Spring physics) */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border-brand-400/50 pointer-events-none z-[999999] mix-blend-screen flex items-center justify-center"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
        variants={ringVariants}
        animate={cursorState}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
      
      {/* Center dot (Instant tracking) */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-surface rounded-full pointer-events-none z-[1000000] mix-blend-screen"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible && cursorState !== 'text' ? 1 : 0,
        }}
      />
    </>
  );
};
