import React, { useState, useEffect } from 'react';
import { toPersianNumbers } from './InlineJalaliCalendar';

interface InlineAnalogTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export const InlineAnalogTimePicker: React.FC<InlineAnalogTimePickerProps> = ({ value, onChange, className = '' }) => {
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        setHour(parseInt(parts[0], 10));
        setMinute(parseInt(parts[1], 10));
      }
    }
  }, [value]);

  const updateTime = (h: number, m: number) => {
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const handleHourSelect = (h: number) => {
    setHour(h);
    updateTime(h, minute);
    setTimeout(() => setMode('minute'), 250);
  };

  const handleMinuteSelect = (m: number) => {
    setMinute(m);
    updateTime(hour, m);
  };

  // Dimensions
  const SIZE = 220;
  const RADIUS_OUTER = 85;
  const RADIUS_INNER = 55;
  const CENTER = SIZE / 2;

  const renderHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        // 1-12 outer, 13-00 inner
        const isInner = i === 0 || i > 12;
        const displayNum = i === 0 ? 0 : i;
        const radius = isInner ? RADIUS_INNER : RADIUS_OUTER;
        
        // angle: 12 is top (270 deg), going clockwise
        // hour % 12 converts 0-23 to 0-11. 3 is 0 deg.
        const angle = ((i % 12) - 3) * 30;
        const rad = angle * Math.PI / 180;
        
        const x = CENTER + radius * Math.cos(rad);
        const y = CENTER + radius * Math.sin(rad);

        const isSelected = hour === i;

        hours.push(
            <div
              key={`h-${i}`}
              onClick={() => handleHourSelect(i)}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-500 text-slate-900 font-medium' : 'text-primary hover:bg-brand-100'
              }`}
              style={{ left: `${x}px`, top: `${y}px` }}
            >
                {toPersianNumbers(String(displayNum).padStart(2, '0'))}
            </div>
        );
    }
    return hours;
  };

  const renderMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) {
        const angle = ((i / 5) - 3) * 30;
        const rad = angle * Math.PI / 180;
        
        const x = CENTER + RADIUS_OUTER * Math.cos(rad);
        const y = CENTER + RADIUS_OUTER * Math.sin(rad);

        const isSelected = minute === i;

        minutes.push(
            <div
              key={`m-${i}`}
              onClick={() => handleMinuteSelect(i)}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-500 text-slate-900 font-medium' : 'text-primary hover:bg-brand-100'
              }`}
              style={{ left: `${x}px`, top: `${y}px` }}
            >
                {toPersianNumbers(String(i).padStart(2, '0'))}
            </div>
        );
    }
    return minutes;
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full font-[var(--font-persian)] select-none bg-surface  border border-border rounded-lg relative ${className}`} dir="ltr">
      {/* Time Display Header */}
      <div className="flex items-center gap-2 mb-4 text-primary dir-ltr text-center justify-center w-full" dir="ltr">
        <div 
          onClick={() => setMode('hour')}
          className={`cursor-pointer px-3 py-1 rounded-lg text-3xl font-medium transition-colors ${mode === 'hour' ? 'bg-surface-hover text-primary' : 'text-muted hover:bg-surface-hover  border border-border-hover/5'}`}
        >
          {toPersianNumbers(String(hour).padStart(2, '0'))}
        </div>
        <div className="text-3xl font-medium text-primary mb-1">:</div>
        <div 
          onClick={() => setMode('minute')}
          className={`cursor-pointer px-3 py-1 rounded-lg text-3xl font-medium transition-colors ${mode === 'minute' ? 'bg-surface-hover text-primary' : 'text-muted hover:bg-surface-hover  border border-border-hover/5'}`}
        >
          {toPersianNumbers(String(minute).padStart(2, '0'))}
        </div>
      </div>

      {/* Clock Face */}
      <div 
        className="relative bg-surface-hover rounded-full"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-brand-500 rounded-full" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
        
        {mode === 'hour' ? renderHours() : renderMinutes()}
      </div>
    </div>
  );
};
