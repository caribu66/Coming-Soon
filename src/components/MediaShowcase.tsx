import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Film, Image, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { mediaItems } from '../data/media';
import type { MediaItem, MediaType } from '../data/media';
import MediaCard from './MediaCard';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import ImageLightbox from './ImageLightbox';

const tabs: { id: MediaType; label: string; icon: typeof Music }[] = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'video', label: 'Video', icon: Film },
  { id: 'image', label: 'Images', icon: Image },
];

const videoItem = mediaItems.find(m => m.type === 'video');

export default function MediaShowcase() {
  const [activeTab, setActiveTab] = useState<MediaType>('music');
  const [audioItem, setAudioItem] = useState<MediaItem | null>(null);
  const [videoOverlayItem, setVideoOverlayItem] = useState<MediaItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => setVideoFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setVideoPlaying(!videoPlaying);
  };

  const toggleVideoFullscreen = async () => {
    if (!videoContainerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await videoContainerRef.current.requestFullscreen();
      }
    } catch {}
  };

  const filtered = useMemo(
    () => mediaItems.filter(m => m.type === activeTab),
    [activeTab]
  );

  const imageItems = useMemo(
    () => mediaItems.filter(m => m.type === 'image'),
    []
  );

  const handlePlay = (item: MediaItem) => {
    if (item.type === 'music') setAudioItem(item);
    if (item.type === 'video') setVideoOverlayItem(item);
  };

  const handleImageClick = (item: MediaItem) => {
    const idx = imageItems.findIndex(i => i.id === item.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  return (
    <div className="p-6 lg:p-10">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04] w-fit mb-8">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-micro font-heading uppercase tracking-[0.1em] transition-all ${
                active ? 'text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="showcase-tab"
                  className="absolute inset-0 bg-white/[0.06] rounded-lg border border-white/[0.06]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-3 h-3" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Video Tab: full-width player */}
      {activeTab === 'video' && videoItem ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          ref={videoContainerRef}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black group"
          onDoubleClick={toggleVideoFullscreen}
        >
          <video
            ref={videoRef}
            src={videoItem.src}
            className="w-full h-full object-contain cursor-pointer"
            autoPlay
            muted
            loop
            playsInline
            onClick={toggleVideoPlay}
          />
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <div className="text-caption font-heading text-white/90">{videoItem.title}</div>
            <div className="text-micro text-white/40">{videoItem.creator}</div>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleVideoPlay}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              {videoPlaying ? <Pause className="w-4 h-4 text-white" fill="white" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />}
            </button>
            <button
              onClick={toggleVideoFullscreen}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              {videoFullscreen ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}
            </button>
          </div>
        </motion.div>
      ) : (
        /* Media Grid */
        <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                onPlay={handlePlay}
                onImageClick={handleImageClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {filtered.length === 0 && activeTab !== 'video' && (
        <div className="py-16 text-center text-caption text-white/30">
          No {activeTab} media available yet.
        </div>
      )}

      <AudioPlayer item={audioItem} onClose={() => setAudioItem(null)} />
      <VideoPlayer item={videoOverlayItem} onClose={() => setVideoOverlayItem(null)} />

      {lightboxIndex !== null && (
        <ImageLightbox
          items={imageItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
