import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, Maximize, Minimize } from 'lucide-react';
import type { MediaItem } from '../data/media';

interface VideoPlayerProps {
  item: MediaItem | null;
  onClose: () => void;
}

export default function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (item) {
      setPlaying(false);
    }
  }, [item]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (fullscreen) {
        await document.exitFullscreen();
      } else {
        await videoRef.current.requestFullscreen();
      }
      setFullscreen(!fullscreen);
    } catch {}
  }, [fullscreen]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
          >
            <video
              ref={videoRef}
              src={item.src}
              className="w-full h-full object-contain"
              playsInline
              onClick={togglePlay}
            />

            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {playing ? <Pause className="w-4 h-4 text-white" fill="white" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="text-caption font-heading text-white/90 truncate">
                  {item.title}
                </div>
                <div className="text-micro text-white/40 truncate">
                  {item.creator}
                </div>
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white/50 hover:text-white/80 transition-colors"
              >
                {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="text-white/50 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
