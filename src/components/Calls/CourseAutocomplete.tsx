import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';

interface CourseAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const CourseAutocomplete: React.FC<CourseAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'دوره مدنظر...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const ALL_COURSES = useMemo(() => {
    const titles = new Set<string>();
    COURSE_CATEGORIES.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        sub.courses.forEach((c) => titles.add(c.title));
      });
    });
    return Array.from(titles);
  }, []);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = ALL_COURSES.filter((o) =>
    o.toLowerCase().includes((localVal || '').toLowerCase())
  );

  return (
    <div className="relative w-full max-w-[190px] mx-auto" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={localVal || ''}
          onChange={(e) => {
            setLocalVal(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          placeholder={placeholder}
          className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 text-center bg-slate-50 dark:bg-[#18222e] border border-slate-300 dark:border-[#33465c] hover:border-slate-400 dark:hover:border-[#475d79] focus:border-blue-500 focus:bg-white dark:focus:bg-[#1c2837] focus:ring-2 focus:ring-blue-500/20 outline-none w-full px-2.5 py-1.5 rounded-lg transition-all placeholder:text-slate-400 dark:placeholder-slate-500 shadow-2xs"
        />
        {localVal ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLocalVal('');
              onChange('');
            }}
            tabIndex={-1}
            className="absolute left-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
            title="پاک کردن دوره"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {isOpen && localVal && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[100] top-full mt-1 w-[240px] left-1/2 -translate-x-1/2 bg-white dark:bg-[#1c2634] border border-slate-200 dark:border-[#304155] rounded-xl shadow-xl max-h-[240px] overflow-y-auto custom-scrollbar flex flex-col p-1 text-right"
          >
            {filtered.map((course) => (
              <button
                key={course}
                type="button"
                onClick={() => {
                  setLocalVal(course);
                  onChange(course);
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-[12px] font-medium text-slate-700 dark:text-[#dbe5f1] hover:bg-brand-50 dark:hover:bg-[#253346] hover:text-brand-700 dark:hover:text-brand-300 text-right rounded-lg w-full transition-colors truncate flex items-center gap-1.5"
              >
                <BookOpen size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="truncate">{course}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
