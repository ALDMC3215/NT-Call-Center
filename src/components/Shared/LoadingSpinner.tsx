import React from 'react';
import { motion } from 'motion/react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex w-full h-full min-h-[50vh] items-center justify-center bg-surface-hover">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-border border-t-brand-500 rounded-full"
      />
    </div>
  );
};
