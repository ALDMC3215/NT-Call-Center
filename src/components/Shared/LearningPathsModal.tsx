import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Route, Brain, ShieldCheck, Gamepad2, Code, Smartphone, Terminal } from 'lucide-react';
import { RoadmapCanvas } from './RoadmapCanvas';
import {
  AI_NODES, AI_EDGES,
  NETWORK_NODES, NETWORK_EDGES,
  KIDS_NODES, KIDS_EDGES,
  BOT_NODES, BOT_EDGES,
  API_NODES, API_EDGES,
  MOBILE_NODES, MOBILE_EDGES
} from '../../data/roadmaps';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LearningPathsModal = ({ isOpen, onClose }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'network' | 'kids' | 'bot' | 'api' | 'mobile'>('ai');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Route size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">مسیرهای یادگیری</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">مسیر پیشنهادی از شروع تا مهارت تخصصی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex px-5 pt-3 bg-slate-50/50 border-b border-slate-100 gap-6 shrink-0 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ai' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Brain size={16} /> هوش مصنوعی
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'network' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck size={16} /> شبکه و امنیت
          </button>
          <button
            onClick={() => setActiveTab('kids')}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'kids' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Gamepad2 size={16} /> کودک و نوجوان
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'bot' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal size={16} /> مبانی و ربات
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'api' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code size={16} /> API و بک‌اند
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`pb-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'mobile' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone size={16} /> برنامه‌نویسی موبایل
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white p-4 md:p-5 flex flex-col h-full min-h-[500px] overflow-hidden rounded-b-2xl">
          {activeTab === 'ai' && <RoadmapCanvas nodes={AI_NODES} edges={AI_EDGES} rootIcon={<Brain size={28} />} />}
          {activeTab === 'network' && <RoadmapCanvas nodes={NETWORK_NODES} edges={NETWORK_EDGES} rootIcon={<ShieldCheck size={28} />} />}
          {activeTab === 'kids' && <RoadmapCanvas nodes={KIDS_NODES} edges={KIDS_EDGES} rootIcon={<Gamepad2 size={28} />} />}
          {activeTab === 'bot' && <RoadmapCanvas nodes={BOT_NODES} edges={BOT_EDGES} rootIcon={<Terminal size={28} />} />}
          {activeTab === 'api' && <RoadmapCanvas nodes={API_NODES} edges={API_EDGES} rootIcon={<Code size={28} />} />}
          {activeTab === 'mobile' && <RoadmapCanvas nodes={MOBILE_NODES} edges={MOBILE_EDGES} rootIcon={<Smartphone size={28} />} />}
        </div>
      </div>
    </div>,
    document.body
  );
};
