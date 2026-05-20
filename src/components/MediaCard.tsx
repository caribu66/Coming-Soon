import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Music, Film, Image } from 'lucide-react';
import type { MediaItem } from '../data/media';

interface MediaCardProps {
  key?: string;
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onImageClick: (item: MediaItem) => void;
}

const typeIcon = {
  music: Music,
  video: Film,
  image: Image,
};

export default function MediaCard({ item, onPlay, onImageClick }: MediaCardProps) {
  const Icon = typeIcon[item.type];
  const isImage = item.type === 'image';
  const isVideo = item.type === 'video';
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.04] cursor-pointer"
      onClick={() => {
        if (isImage) onImageClick(item);
        else onPlay(item);
      }}
    >
      {isVideo ? (
        <video
          src={item.src}
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
        />
      ) : (
        <img
          src={imgError ? `https://picsum.photos/600/600?random=${item.id}` : item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-micro font-heading uppercase tracking-[0.1em] text-white/70 flex items-center gap-1.5 z-10">
        <Icon className="w-3 h-3" />
        {item.type}
      </div>

      {!isImage && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-4 z-10">
        <h3 className="text-h3 font-heading text-white/90 truncate group-hover:text-white transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {item.creatorAvatar && (
            <img
              src={item.creatorAvatar}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
          <span className="text-caption text-white/50">{item.creator}</span>
        </div>
      </div>
    </motion.div>
  );
}
