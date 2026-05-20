import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaItem } from '../data/media';

interface ImageLightboxProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function ImageLightbox({ items, currentIndex, onClose, onNavigate }: ImageLightboxProps) {
  const item = items[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(Math.max(0, currentIndex - 1));
      if (e.key === 'ArrowRight') onNavigate(Math.min(items.length - 1, currentIndex + 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, items.length, onClose, onNavigate]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
                className="absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            )}

            <motion.img
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={item.src}
              alt={item.title}
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
                className="absolute right-4 md:right-8 z-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>
            )}
          </div>

          <div className="absolute bottom-6 inset-x-0 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/[0.04]">
              <span className="text-caption text-white/70">{item.title}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-caption text-white/40">{item.creator}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-micro text-white/30">{currentIndex + 1} / {items.length}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
