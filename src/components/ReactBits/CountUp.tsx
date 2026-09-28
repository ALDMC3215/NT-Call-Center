'use client';

import { useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import React, { useCallback, useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * CountUp Component from @react-bits registry (CountUp-TS-TW)
 * Optimized for dashboard metrics:
 * - Runs animation only on initial mount
 * - Respects prefers-reduced-motion
 * - Avoids hydration mismatches
 */
export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1.2,
  className = '',
  startWhen = true,
  separator = '،',
  onStart,
  onEnd
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const hasAnimatedRef = useRef(false);

  const motionValue = useMotionValue<number>(direction === 'down' ? to : from);

  const damping = 20 + 40 * (1 / Math.max(duration, 0.1));
  const stiffness = 100 * (1 / Math.max(duration, 0.1));

  const springValue = useSpring(motionValue, {
    damping,
    stiffness
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const formatValue = useCallback(
    (latest: number) => {
      const rounded = Math.round(latest);
      const formatted = new Intl.NumberFormat('fa-IR', {
        useGrouping: !!separator
      }).format(rounded);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [separator]
  );

  useEffect(() => {
    if (ref.current) {
      if (shouldReduceMotion) {
        ref.current.textContent = formatValue(to);
        return;
      }
      ref.current.textContent = formatValue(direction === 'down' ? to : from);
    }
  }, [from, to, direction, formatValue, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) {
      if (ref.current) {
        ref.current.textContent = formatValue(to);
      }
      return;
    }

    if (isInView && startWhen && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      if (typeof onStart === 'function') {
        onStart();
      }

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') {
            onEnd();
          }
        },
        delay * 1000 + duration * 1000
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration, formatValue, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const unsubscribe = springValue.on('change', (latest: any) => {
      if (ref.current) {
        ref.current.textContent = formatValue(Number(latest) || 0);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue, shouldReduceMotion]);

  return <span className={className} ref={ref}>{formatValue(to)}</span>;
};

export default CountUp;
