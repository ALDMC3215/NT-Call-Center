import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';

interface TableMultiSelectProps {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TableMultiSelect = ({ values, onChange, placeholder, disabled }: TableMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, right: 0, direction: 'down' as 'down' | 'up' });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCourses = useMemo(() => {
    let dynamicData: Record<string, any> = {};
    try {
      const cached = localStorage.getItem('NOVINTECH_COURSE_DYNAMIC_DATA');
      if (cached) {
        dynamicData = JSON.parse(cached);
      }
    } catch (e) {
      console.error("Failed to load dynamic course data", e);
    }

    const courses = new Set<string>();

    COURSE_CATEGORIES.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.courses.forEach(c => {
          if (c.url && dynamicData[c.url]?.title) {
            courses.add(dynamicData[c.url].title);
          } else {
            courses.add(c.title);
          }
        });
      });
    });

    // Preserve previously selected historical titles
    if (values && Array.isArray(values)) {
      values.forEach(v => courses.add(v));
    }

    return Array.from(courses);
  }, [values]);

  const updatePosition = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const dropdownHeight = 300;
      const direction = spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'up' : 'down';

      setCoords({
        right: window.innerWidth - rect.right,
        top: direction === 'down' ? rect.bottom + 4 : rect.top - 4,
        direction
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScroll = (e: Event) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
        setIsOpen(false);
      };
      const handleResize = () => setIsOpen(false);

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleVal = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const filteredOptions = useMemo(() => {
    if (!search) return allCourses;
    return allCourses.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  }, [allCourses, search]);

  return (
    <div ref={wrapperRef} className="inline-flex items-center text-right">
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`outline-none pl-8 pr-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer w-full justify-between min-w-[140px] max-w-[180px] ${disabled ? 'opacity-60 grayscale cursor-not-allowed border-transparent text-slate-400' :
          values.length === 0 ? 'border-transparent hover:border-slate-300 text-[13px] text-slate-500 font-medium' : 'border-slate-300 bg-white hover:bg-slate-50 text-[14px] font-bold text-slate-800'
          }`}
      >
        <span className="truncate">{values.length > 0 ? values.join(' ، ') : placeholder}</span>
        <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.direction === 'down' ? coords.top : 'auto',
            bottom: coords.direction === 'up' ? window.innerHeight - coords.top : 'auto',
            right: coords.right,
          }}
          className="w-[450px] bg-surface border border-border rounded-xl shadow-xl z-[99999] overflow-hidden flex flex-col"
        >
          <div className="p-2 border-b border-border relative">
            <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو دوره..."
              className="w-full bg-surface-hover border border-border rounded-lg text-xs py-2 pr-8 pl-2 outline-none text-primary focus:border-brand-500 transition-colors"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto custom-select-scroll py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted text-center">موردی یافت نشد</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggleVal(opt)}
                  className={`w-full text-right px-4 py-2.5 text-[13px] transition-colors flex items-start justify-between gap-3 ${values.includes(opt) ? 'bg-brand-50 text-brand-700 font-medium' : 'text-primary hover:bg-surface-hover'
                    }`}
                >
                  <span className="leading-5">{opt}</span>
                  {values.includes(opt) && <Check size={16} className="shrink-0 mt-0.5" />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
