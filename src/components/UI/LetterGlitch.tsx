import React, { useRef, useEffect } from 'react';

export interface LetterGlitchProps {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  lightMode?: boolean;
  backgroundColor?: string;
  className?: string;
  characters?: string;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const FALLBACK_RGB: Rgb = { r: 0, g: 99, b: 25 };

export const LetterGlitch: React.FC<LetterGlitchProps> = ({
  glitchColors = ['#006319', '#006319', '#000000'],
  glitchSpeed = 50,
  centerVignette = true,
  outerVignette = false,
  smooth = true,
  lightMode = false,
  backgroundColor = '#000000',
  className = '',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}#@+/',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTabVisibleRef = useRef<boolean>(true);
  const letters = useRef<
    {
      char: string;
      rgb: Rgb;
      fromRgb: Rgb;
      targetRgb: Rgb;
      colorProgress: number;
    }[]
  >([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());

  const lettersAndSymbols = Array.from(characters);

  const fontSize = 15;
  const charWidth = 11;
  const charHeight = 22;

  const getRandomChar = () => {
    return lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)] || '0';
  };

  const getRandomColor = () => {
    return glitchColors[Math.floor(Math.random() * glitchColors.length)] || '#006319';
  };

  const hexToRgb = (hex: string): Rgb | null => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const cleanHex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const mixRgb = (start: Rgb, end: Rgb, factor: number): Rgb => ({
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor),
  });

  const rgbToCss = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`;

  const getRandomRgb = (): Rgb => hexToRgb(getRandomColor()) || FALLBACK_RGB;

  const calculateGrid = (width: number, height: number) => {
    const columns = Math.ceil(width / charWidth);
    const rows = Math.ceil(height / charHeight);
    return { columns, rows };
  };

  const initializeLetters = (columns: number, rows: number) => {
    grid.current = { columns, rows };
    const totalLetters = columns * rows;
    letters.current = Array.from({ length: totalLetters }, () => {
      const rgb = getRandomRgb();
      return {
        char: getRandomChar(),
        rgb,
        fromRgb: rgb,
        targetRgb: getRandomRgb(),
        colorProgress: 1,
      };
    });
  };

  const drawLetters = () => {
    const canvas = canvasRef.current;
    if (!context.current || !canvas || letters.current.length === 0) return;
    const ctx = context.current;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = rgbToCss(letter.rgb);
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    if (!letters.current || letters.current.length === 0) return;

    // Up to 4% of characters shift per glitch tick
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.04));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.current.length);
      if (!letters.current[index]) continue;

      letters.current[index].char = getRandomChar();
      letters.current[index].fromRgb = letters.current[index].rgb;
      letters.current[index].targetRgb = getRandomRgb();

      if (!smooth) {
        letters.current[index].rgb = letters.current[index].targetRgb;
        letters.current[index].colorProgress = 1;
      } else {
        letters.current[index].colorProgress = 0;
      }
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.06;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        letter.rgb = mixRgb(letter.fromRgb, letter.targetRgb, letter.colorProgress);
        needsRedraw = true;
      }
    });

    if (needsRedraw) {
      drawLetters();
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Cap DPR to 2 to protect high-density screens from GPU strain
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) {
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    context.current = canvas.getContext('2d');
    resizeCanvas();

    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If reduced motion is requested, draw one static frame and do not start animation loop
    if (prefersReducedMotion) {
      drawLetters();
      return;
    }

    const animate = () => {
      if (!isTabVisibleRef.current) return;

      const now = Date.now();
      if (now - lastGlitchTime.current >= glitchSpeed) {
        updateLetters();
        drawLetters();
        lastGlitchTime.current = now;
      }

      if (smooth) {
        handleSmoothTransitions();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    startAnimation();

    // 1. Visibility change listener (pause loop when tab inactive)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabVisibleRef.current = false;
        stopAnimation();
      } else {
        isTabVisibleRef.current = true;
        lastGlitchTime.current = Date.now();
        startAnimation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Debounced resize listener
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        stopAnimation();
        resizeCanvas();
        if (isTabVisibleRef.current) {
          startAnimation();
        }
      }, 120);
    };

    window.addEventListener('resize', handleResize);

    // 3. ResizeObserver on parent element for responsive container tracking
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(canvas.parentElement);
    }

    return () => {
      stopAnimation();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [glitchSpeed, smooth, glitchColors, characters]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        backgroundColor: backgroundColor || (lightMode ? '#ffffff' : '#010503'),
        contain: 'layout paint',
        isolation: 'isolate',
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background: lightMode
              ? 'radial-gradient(circle, rgba(255,255,255,0) 50%, rgba(255,255,255,0.96) 100%)'
              : 'radial-gradient(circle, rgba(0,0,0,0) 45%, rgba(0,0,0,0.92) 100%)',
          }}
        />
      )}
      {centerVignette && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background: lightMode
              ? 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 65%)'
              : 'radial-gradient(circle, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 65%)',
          }}
        />
      )}
    </div>
  );
};

export default LetterGlitch;
