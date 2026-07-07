"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale } from "../../hooks/useLocale";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastIcons = {
  success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 text-rose-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-brand-500" />,
};

const toastClasses = {
  success: "border-border/50 bg-surface text-primary shadow-lg",
  error: "border-border/50 bg-surface text-primary shadow-lg",
  warning: "border-border/50 bg-surface text-primary shadow-lg",
  info: "border-border/50 bg-surface text-primary shadow-lg",
};

// Global event emitter for toast
type ToastListener = (toast: ToastProps) => void;
let listeners: ToastListener[] = [];
const emitToast = (toast: ToastProps) => {
  listeners.forEach(listener => listener(toast));
};

export const customToast = Object.assign(
  (message: string, options?: number | { icon?: string; duration?: number; action?: ToastProps['action'] }) => emitToast({ id: Date.now().toString() + Math.random(), message, type: 'info', duration: typeof options === 'number' ? options : options?.duration || 3000, action: typeof options === 'object' ? options.action : undefined }),
  {
    success: (message: string, options?: number | { icon?: string; duration?: number; action?: ToastProps['action'] }) => emitToast({ id: Date.now().toString() + Math.random(), message, type: 'success', duration: typeof options === 'number' ? options : options?.duration || 3000, action: typeof options === 'object' ? options.action : undefined }),
    error: (message: string, options?: number | { icon?: string; duration?: number; action?: ToastProps['action'] }) => emitToast({ id: Date.now().toString() + Math.random(), message, type: 'error', duration: typeof options === 'number' ? options : options?.duration || 4000, action: typeof options === 'object' ? options.action : undefined }),
    warning: (message: string, options?: number | { icon?: string; duration?: number; action?: ToastProps['action'] }) => emitToast({ id: Date.now().toString() + Math.random(), message, type: 'warning', duration: typeof options === 'number' ? options : options?.duration || 4000, action: typeof options === 'object' ? options.action : undefined }),
    info: (message: string, options?: number | { icon?: string; duration?: number; action?: ToastProps['action'] }) => emitToast({ id: Date.now().toString() + Math.random(), message, type: 'info', duration: typeof options === 'number' ? options : options?.duration || 3000, action: typeof options === 'object' ? options.action : undefined }),
  }
);

const BasicToast: React.FC<{ toast: ToastProps; onClose: (id: string) => void; key?: React.Key }> = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const { direction } = useLocale();

  useEffect(() => {
    if (visible && toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose(toast.id), 300); // Wait for exit animation
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [visible, toast.duration, toast.id, onClose]);

  return (
    <motion.div
      layout
      dir={direction}
      animate={
        shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
      }
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 min-w-[280px] max-w-sm ${toastClasses[toast.type || 'info']}`}
      exit={
        shouldReduceMotion
          ? { opacity: 0, transition: { duration: 0 } }
          : {
              opacity: 0,
              y: 20,
              scale: 0.9,
              transition: { duration: 0.15 },
            }
      }
      initial={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 0, y: 20, scale: 0.9 }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring" as const, bounce: 0.2, duration: 0.3 }
      }
    >
      <div className="flex-shrink-0">{toastIcons[toast.type || 'info']}</div>
      <p className="flex-1 text-[13px] font-medium tracking-tight">{toast.message}</p>
      
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            setVisible(false);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className="px-3 py-1.5 ml-2 text-[12px] font-bold bg-white text-slate-800 rounded-lg shadow-sm hover:bg-slate-50 transition-colors border border-slate-200 shrink-0"
        >
          {toast.action.label}
        </button>
      )}

      <button
        className="flex-shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-surface-hover hover:text-primary"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const { direction } = useLocale();

  useEffect(() => {
    const listener = (toast: ToastProps) => {
      setToasts(prev => [...prev, toast]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const handleClose = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed bottom-4 right-4 z-[99999] flex flex-col justify-end gap-2 pointer-events-none p-4`}>
      <AnimatePresence>
        {toasts.map(toast => (
          <BasicToast key={toast.id} toast={toast} onClose={handleClose} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
