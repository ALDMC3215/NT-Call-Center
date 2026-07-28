import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { customToast as toast } from '../UI/toast';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const { tr, direction } = useLocale();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: Point) => setCrop(crop), []);
  const onZoomChange = useCallback((zoom: number) => setZoom(zoom), []);
  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Set canvas size to the cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image onto the canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error(tr('خطا در پردازش تصویر.', 'Error processing image.'));
          setIsProcessing(false);
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCropComplete(file, previewUrl);
        setIsProcessing(false);
        onClose();
      }, 'image/jpeg', 0.95);

    } catch (e) {
      console.error(e);
      toast.error(tr('خطا در پردازش تصویر.', 'Error processing image.'));
      setIsProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir={direction}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#1c2530] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#2b3745]">
              <h3 className="font-bold text-slate-800 dark:text-[#f3f5f7]">
                {tr('تنظیم تصویر پروفایل', 'Adjust Profile Picture')}
              </h3>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#f3f5f7] transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cropper Area */}
            <div className="relative w-full h-80 bg-slate-100 dark:bg-[#171e27]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={onCropChange}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={onZoomChange}
              />
            </div>

            {/* Controls */}
            <div className="p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-[#8e9aaa]">
                  <span>{tr('کوچک‌نمایی', 'Zoom Out')}</span>
                  <span>{tr('بزرگ‌نمایی', 'Zoom In')}</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-[#2b3745] rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-bold text-sm text-slate-500 dark:text-[#8e9aaa] hover:bg-slate-100 dark:hover:bg-[#202b38] transition-colors"
                >
                  {tr('انصراف', 'Cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                >
                  <Check size={16} />
                  {tr('تایید و ذخیره', 'Crop & Save')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
