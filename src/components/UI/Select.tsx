import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DURATION_INSTANT,
  SPRING_DEFAULT,
  SPRING_SNAPPY,
} from "../../lib/animation";

// Local cn helper — no external dependency needed
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHEVRON_ROTATION = 180;
const DROPDOWN_OFFSET = 4;
const STAGGER_DELAY = 0.02;
const ITEM_HOVER_X = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectOptionProps {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface SelectGroupOption {
  label: string;
  options: SelectOptionProps[];
}

export interface SelectProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  contentClassName?: string;
  defaultValue?: string;
  disabled?: boolean;
  groups?: SelectGroupOption[];
  name?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOptionProps[];
  placeholder?: string;
  required?: boolean;
  size?: "sm" | "default" | "lg";
  value?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  name,
  options,
  groups,
  className,
  contentClassName,
  size = "default",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const selectedValue =
    controlledValue === undefined ? internalValue : controlledValue;

  const allOptions: SelectOptionProps[] = (() => {
    const flat: SelectOptionProps[] = [];
    if (options) {
      for (const opt of options) flat.push(opt);
    }
    if (groups) {
      for (const group of groups) {
        for (const opt of group.options) flat.push(opt);
      }
    }
    return flat;
  })();

  const selectedLabel = allOptions.find(
    (opt) => opt.value === selectedValue
  )?.label;

  const handleSelect = useCallback(
    (opt: SelectOptionProps) => {
      if (opt.disabled) return;
      if (controlledValue === undefined) {
        setInternalValue(opt.value);
      }
      onValueChange?.(opt.value);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    },
    [controlledValue, onValueChange]
  );

  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + DROPDOWN_OFFSET,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen((prev) => !prev);
    setFocusedIndex(-1);
  }, [disabled, isOpen]);

  // Position updates on scroll/resize
  useEffect(() => {
    if (!(isOpen && triggerRef.current)) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + DROPDOWN_OFFSET,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        portalRef.current &&
        !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        if (
          (event.key === "Enter" || event.key === " ") &&
          document.activeElement === triggerRef.current
        ) {
          event.preventDefault();
          handleToggle();
        }
        return;
      }
      if (event.key === "Escape") {
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev < allOptions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : allOptions.length - 1
        );
      } else if (event.key === "Enter" && focusedIndex >= 0) {
        event.preventDefault();
        const opt = allOptions[focusedIndex];
        if (opt) handleSelect(opt);
      } else if (event.key === "Home") {
        event.preventDefault();
        setFocusedIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setFocusedIndex(allOptions.length - 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allOptions, focusedIndex, handleSelect, handleToggle]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderItem = (opt: SelectOptionProps, globalIndex: number) => {
    const isSelected = opt.value === selectedValue;
    const isFocused = globalIndex === focusedIndex;

    return (
      <motion.div
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={
          shouldReduceMotion
            ? { opacity: 0, transition: { duration: 0 } }
            : { opacity: 0, x: -8 }
        }
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
        key={opt.value}
        transition={
          shouldReduceMotion
            ? DURATION_INSTANT
            : {
                ...SPRING_SNAPPY,
                delay: globalIndex * STAGGER_DELAY,
              }
        }
        whileHover={shouldReduceMotion ? {} : { x: ITEM_HOVER_X }}
      >
        <button
          aria-selected={isSelected}
          className={cn(
            "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-2 pr-8 pl-3 text-right text-sm outline-none",
            "transition-colors",
            opt.disabled
              ? "pointer-events-none opacity-50"
              : "hover:bg-surface-hover hover:text-slate-900 text-primary",
            isFocused && "bg-surface-hover text-slate-900",
            isSelected && "font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-50"
          )}
          disabled={opt.disabled}
          onClick={() => handleSelect(opt)}
          onMouseEnter={() => setFocusedIndex(globalIndex)}
          role="option"
          type="button"
        >
          <span className="flex-1 truncate">{opt.label}</span>

          <span className="absolute right-2 flex size-3.5 items-center justify-center">
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0, transition: { duration: 0 } }
                      : { scale: 0, opacity: 0 }
                  }
                  initial={shouldReduceMotion ? {} : { scale: 0, opacity: 0 }}
                  transition={
                    shouldReduceMotion
                      ? DURATION_INSTANT
                      : {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          duration: 0.2,
                        }
                  }
                >
                  <Check className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>
      </motion.div>
    );
  };

  let globalIndex = 0;

  // ---------------------------------------------------------------------------
  // Dropdown content (portalled)
  // ---------------------------------------------------------------------------

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <div ref={portalRef}>
          <motion.div
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            className={cn(
              "fixed z-50 origin-top overflow-hidden rounded-xl border border-border bg-surface text-primary ",
              contentClassName
            )}
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : {
                    opacity: 0,
                    scale: 0.95,
                    y: -4,
                    transition: { duration: 0.15 },
                  }
            }
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.95, y: -4 }
            }
            role="listbox"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
            transition={shouldReduceMotion ? DURATION_INSTANT : SPRING_DEFAULT}
          >
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar" dir="rtl">
              {options &&
                options.length > 0 &&
                (() => {
                  const items = options.map((opt) => {
                    const idx = globalIndex;
                    globalIndex += 1;
                    return renderItem(opt, idx);
                  });
                  return items;
                })()}

              {groups &&
                groups.map((group, groupIdx) => {
                  const groupItems = group.options.map((opt) => {
                    const idx = globalIndex;
                    globalIndex += 1;
                    return renderItem(opt, idx);
                  });

                  return (
                    <div key={group.label}>
                      {groupIdx > 0 && (
                        <div className="pointer-events-none -mx-1 my-1 h-px bg-surface-hover" />
                      )}
                      <div className="px-2 py-1.5 text-muted text-xs">
                        {group.label}
                      </div>
                      {groupItems}
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="relative inline-block w-full" ref={wrapperRef} dir="rtl">
        {name && (
          <input
            aria-hidden="true"
            name={name}
            required={required}
            tabIndex={-1}
            type="hidden"
            value={selectedValue}
          />
        )}

        <button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-required={required || undefined}
          className={cn(
            "flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-border bg-surface px-4 py-2.5 text-sm  outline-none transition-all hover:bg-surface-hover hover:border-border focus-visible:border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 text-primary",
            size === "default" ? "h-11" : size === "lg" ? "h-14 text-base" : "h-9",
            className
          )}
          data-placeholder={!selectedLabel || undefined}
          disabled={disabled}
          onClick={handleToggle}
          ref={triggerRef}
          role="combobox"
          type="button"
        >
          <span
            className={cn(
              "line-clamp-1 flex items-center gap-2 text-right",
              !selectedLabel && "text-muted"
            )}
          >
            {selectedLabel ?? placeholder}
          </span>

          <motion.div
            animate={{ rotate: isOpen ? CHEVRON_ROTATION : 0 }}
            className="shrink-0"
            transition={
              shouldReduceMotion
                ? DURATION_INSTANT
                : { type: "spring", duration: 0.25, bounce: 0.05 }
            }
          >
            <ChevronDown className="size-4 opacity-50" />
          </motion.div>
        </button>
      </div>

      {typeof window === "undefined"
        ? null
        : createPortal(dropdownContent, document.body)}
    </>
  );
}
