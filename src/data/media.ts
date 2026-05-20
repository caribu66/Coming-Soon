export type MediaType = 'music' | 'video' | 'image';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  creator: string;
  creatorAvatar?: string;
  thumbnail: string;
  src: string;
  description?: string;
}

export const mediaItems: MediaItem[] = [
  // --- Music ---
  {
    id: 'm1',
    type: 'music',
    title: 'Analog Warmth',
    creator: 'V. Katz',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=m1',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'A generative study of analog texture through digital precision.',
  },
  {
    id: 'm2',
    type: 'music',
    title: 'Urban Pulse',
    creator: 'E. Mora',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=m2',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    description: 'Rhythmic textures from urban environmental data.',
  },
  {
    id: 'm3',
    type: 'music',
    title: 'Deep Field',
    creator: 'S. Nova',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=m3',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    description: 'Ethereal layers recorded from deep-space signal data.',
  },
  {
    id: 'm4',
    type: 'music',
    title: 'Resonant Space',
    creator: 'L. Chen',
    creatorAvatar: 'https://images.unsplash.com/photo-1506796515668-7d40e170364c?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=m4',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    description: 'Generative composition from architectural acoustic models.',
  },
  {
    id: 'm5',
    type: 'music',
    title: 'Machine Dream',
    creator: 'D_MODE',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778242-f8d21e23ad75?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=m5',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    description: 'AI-mediated soundscapes from neural network training data.',
  },
  {
    id: 'm6',
    type: 'music',
    title: 'Pristine Keys',
    creator: 'LUNA_T',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=m6',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    description: 'Spatial piano composition rendered from cathedral acoustics.',
  },

  // --- Videos ---
  {
    id: 'v1',
    type: 'video',
    title: 'Wave Sync',
    creator: 'D_MODE',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778242-f8d21e23ad75?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://picsum.photos/600/600?random=v1',
    src: 'https://assets.mixkit.co/videos/9370/9370-720.mp4',
    description: 'Audio-reactive digital equalizer generating real-time music visualizations.',
  },

  // --- Images ---
  {
    id: 'i1',
    type: 'image',
    title: 'Industrial Pulse',
    creator: 'E. Mora',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80',
    src: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1920&q=80',
    description: 'Data visualization generated from deep-sea sensor telemetry.',
  },
  {
    id: 'i2',
    type: 'image',
    title: 'Urban Decay',
    creator: 'S. Nova',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
    src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',
    description: 'Photo essay documenting the city at 4 AM.',
  },
  {
    id: 'i3',
    type: 'image',
    title: 'Ethical Core',
    creator: 'L. Chen',
    creatorAvatar: 'https://images.unsplash.com/photo-1506796515668-7d40e170364c?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    description: 'Generative artwork from protocol consensus timestamps.',
  },
  {
    id: 'i4',
    type: 'image',
    title: 'Human Element',
    creator: 'D. Reid',
    creatorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1920&q=80',
    description: 'High-fidelity portrait study for decentralized collaboration.',
  },
  {
    id: 'i5',
    type: 'image',
    title: 'Voltage Control',
    creator: 'Alexis',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&q=80',
    src: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1920&q=80',
    description: 'Interactive visual system for real-time collaborative creation.',
  },
  {
    id: 'i6',
    type: 'image',
    title: 'Artifact Hive',
    creator: 'ZERO_G',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80',
    description: 'Curated collection of verified creative works.',
  },
];
