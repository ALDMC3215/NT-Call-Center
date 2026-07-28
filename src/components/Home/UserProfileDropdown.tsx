import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Edit2, Lock, Camera, Upload, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { customToast as toast } from '../UI/toast';
import { supabase } from '../../lib/supabase';
import { ImageCropperModal } from './ImageCropperModal';

export const UserProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { profile, setProfile } = useAppContext();
  const { updateOwnProfile, supabaseUser } = useAuth();
  const { tr, direction } = useLocale();

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  
  // Info State
  const [name, setName] = useState(profile?.name || '');
  const [shift, setShift] = useState(profile?.shift || 'Morning');
  const [branch, setBranch] = useState(profile?.branch || 'پردیس');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setShift(profile.shift);
      setBranch(profile.branch);
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // allow up to 2MB for the raw image before cropping
      toast.error(tr('حجم تصویر نباید بیشتر از ۲ مگابایت باشد.', 'Image size cannot exceed 2MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(previewUrl);
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(tr('نام نمی‌تواند خالی باشد.', 'Name cannot be empty.'));
      return;
    }
    
    setIsUpdatingInfo(true);
    const error = await updateOwnProfile(name, shift, branch, avatarFile || undefined);
    setIsUpdatingInfo(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(tr('اطلاعات با موفقیت به‌روزرسانی شد.', 'Information updated successfully.'));
      if (profile) {
        setProfile({ ...profile, name, shift, branch, avatar_url: avatarPreview });
      }
      setAvatarFile(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(tr('لطفاً تمام فیلدها را پر کنید.', 'Please fill all fields.'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(tr('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.', 'New password must be at least 8 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(tr('رمز عبور جدید و تکرار آن مطابقت ندارند.', 'New password and confirmation do not match.'));
      return;
    }
    if (!supabaseUser?.email) {
      toast.error(tr('ایمیل کاربر یافت نشد.', 'User email not found.'));
      return;
    }

    setIsChangingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: supabaseUser.email,
      password: currentPassword
    });

    if (signInError) {
      setIsChangingPassword(false);
      toast.error(tr('رمز عبور فعلی نامعتبر است.', 'Current password invalid.'));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    setIsChangingPassword(false);

    if (updateError) {
      toast.error(tr('خطایی در تغییر رمز عبور رخ داد. دوباره تلاش کنید.', 'Generic retry error.'));
    } else {
      toast.success(tr('رمز عبور با موفقیت تغییر کرد.', 'Password changed successfully.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('info');
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir={direction}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white dark:bg-[#1c2530] border border-stone-200 dark:border-[#2b3745] shadow-sm flex items-center justify-center hover:bg-stone-50 dark:hover:bg-[#253242] transition-colors overflow-hidden group"
        title={tr('پروفایل کاربری', 'User Profile')}
      >
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <User size={20} className="text-stone-500 dark:text-[#8e9aaa] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
        )}
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1c2530] rounded-2xl border border-stone-200 dark:border-[#2b3745] shadow-xl overflow-hidden right-0 origin-top-right"
          >
            <div className="p-4 bg-slate-50 dark:bg-[#171e27] border-b border-stone-100 dark:border-[#2b3745] flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-[#f3f5f7]">{tr('تنظیمات پروفایل', 'Profile Settings')}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#f3f5f7]">
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-stone-100 dark:border-[#2b3745]">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'info' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 dark:text-[#8e9aaa] hover:bg-slate-50 dark:hover:bg-[#202b38]'}`}
              >
                <Edit2 size={16} />
                {tr('اطلاعات کاربری', 'User Info')}
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'password' ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400' : 'text-slate-500 dark:text-[#8e9aaa] hover:bg-slate-50 dark:hover:bg-[#202b38]'}`}
              >
                <Lock size={16} />
                {tr('رمز عبور', 'Password')}
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto hide-scrollbar">
              {activeTab === 'info' && (
                <form onSubmit={handleUpdateInfo} className="flex flex-col gap-4">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#202b38] border-2 border-dashed border-slate-300 dark:border-[#3b4b5e] overflow-hidden flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={32} className="text-slate-400 dark:text-[#64748b]" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md hover:bg-indigo-700 transition-colors">
                        <Upload size={14} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      </label>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-[#8e9aaa]">{tr('حداکثر ۱ مگابایت (۱:۱)', 'Max 1MB (1:1)')}</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-[#8e9aaa] mb-1.5 block">{tr('نام و نام خانوادگی', 'Full Name')}</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] text-slate-900 dark:text-[#f3f5f7] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-[#8e9aaa] mb-1.5 block">{tr('شیفت کاری', 'Work Shift')}</label>
                      <select 
                        value={shift} 
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full h-10 pr-3 pl-9 text-sm border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] text-slate-900 dark:text-[#f3f5f7] rounded-lg outline-none"
                      >
                        <option value="Morning">{tr('صبح', 'Morning')}</option>
                        <option value="Evening">{tr('عصر', 'Evening')}</option>
                        <option value="Admin">{tr('مدیریت', 'Admin')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-[#8e9aaa] mb-1.5 block">{tr('محل استقرار', 'Branch')}</label>
                      <select 
                        value={branch} 
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full h-10 pr-3 pl-9 text-sm border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] text-slate-900 dark:text-[#f3f5f7] rounded-lg outline-none"
                      >
                        <option value="پردیس">{tr('پردیس', 'Pardis')}</option>
                        <option value="زرگری">{tr('زرگری', 'Zargari')}</option>
                        <option value="Admin">{tr('مدیریت', 'Admin')}</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isUpdatingInfo}
                    className="mt-2 h-10 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                  >
                    {isUpdatingInfo ? <RefreshCw size={16} className="animate-spin" /> : <Edit2 size={16} />}
                    {tr('ذخیره اطلاعات', 'Save Info')}
                  </button>
                </form>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-[#8e9aaa] mb-1.5 block">{tr('رمز عبور فعلی', 'Current Password')}</label>
                    <input 
                      type="password" 
                      dir="ltr"
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] text-slate-900 dark:text-[#f3f5f7] rounded-lg outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-[#8e9aaa] mb-1.5 block">{tr('رمز عبور جدید', 'New Password')}</label>
                    <input 
                      type="password" 
                      dir="ltr"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] text-slate-900 dark:text-[#f3f5f7] rounded-lg outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-[#8e9aaa] mb-1.5 block">{tr('تکرار رمز جدید', 'Confirm New Password')}</label>
                    <input 
                      type="password" 
                      dir="ltr"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] text-slate-900 dark:text-[#f3f5f7] rounded-lg outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="mt-2 h-10 w-full bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                  >
                    {isChangingPassword ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                    {tr('تغییر رمز عبور', 'Change Password')}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
