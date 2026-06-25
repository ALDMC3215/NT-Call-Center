import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  const allCourses = useMemo(() => {
    const courses = new Set<string>();
    COURSE_CATEGORIES.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.courses.forEach(c => courses.add(c.title));
      });
    });
    return Array.from(courses);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
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
    <div ref={ref} className="relative inline-flex items-center text-right">
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`outline-none pl-8 pr-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer w-full justify-between min-w-[140px] max-w-[180px] ${disabled ? 'opacity-50 grayscale cursor-not-allowed border-transparent text-muted' :
          values.length === 0 ? 'border-transparent hover:border-border text-[13px] text-muted' : 'border-border bg-surface-hover hover:bg-surface-hover text-[14px] font-medium text-primary'
          }`}
      >
        <span className="truncate">{values.length > 0 ? values.join(' ، ') : placeholder}</span>
        <ChevronDown size={14} className={`text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-[450px] bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
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
        </div>
      )}
    </div>
  );
};
