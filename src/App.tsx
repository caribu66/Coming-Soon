/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Video, 
  Database, 
  Globe,
  Zap,
  Layers,
  Shield,
  Headphones,
  Mic,
  Disc,
  Volume2,
  X,
  Loader2,
  Twitter,
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location?: string;
  verusId: string;
}

interface Asset {
  id: string;
  title: string;
  fullName: string;
  description: string;
  val: string;
  type: string;
  src: string;
  icon: any;
  creator: UserProfile;
  owner: UserProfile;
}

// Helper function to generate consistent placeholder images
const getPicsumUrl = (seed: string, width: number, height: number = width) => 
  `https://picsum.photos/${width}/${height}?random=${seed}`;

// Music/artist-focused portrait set for showcase.
const avatarBySeed: Record<string, string> = {
  katz: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  mora: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  chen: 'https://images.unsplash.com/photo-1506796515668-7d40e170364c?auto=format&fit=crop&w=300&q=80',
  jax: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  nova: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  reid: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=300&q=80',
  alex: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
  ross: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  luna: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  cyber: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80',
  dmode: 'https://images.unsplash.com/photo-1506794778242-f8d21e23ad75?auto=format&fit=crop&w=300&q=80',
  zerog: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
};

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=300&q=80';

const getAvatarUrl = (seed: string) => avatarBySeed[seed] ?? AVATAR_FALLBACK;

const profiles: Record<string, UserProfile> = {
  katz: {
    id: 'u1',
    name: 'V. KATZ',
    handle: 'katz@',
    avatar: getAvatarUrl('katz'),
    bio: 'Modular synthesis expert exploring the intersection of analog warmth and digital precision.',
    location: 'Berlin, DE',
    verusId: 'katz.v@'
  },
  mora: {
    id: 'u2',
    name: 'E. MORA',
    handle: 'mora@',
    avatar: getAvatarUrl('mora'),
    bio: 'Sonic architect of spatial environments and industrial soundscapes.',
    location: 'Tokyo, JP',
    verusId: 'mora.e@'
  },
  chen: {
    id: 'u3',
    name: 'L. CHEN',
    handle: 'chen@',
    avatar: getAvatarUrl('chen'),
    bio: 'Multi-disciplinary artist specializing in generative audiovisual experiences.',
    location: 'Seoul, KR',
    verusId: 'chen.l@'
  },
  jax: {
    id: 'u4',
    name: 'B. JAX',
    handle: 'jaxx@',
    avatar: getAvatarUrl('jax'),
    bio: 'Decentralized audio pioneer focused on stem-based collaboration frameworks.',
    location: 'London, UK',
    verusId: 'jax.b@'
  },
  nova: {
    id: 'u5',
    name: 'S. NOVA',
    handle: 'nova@',
    avatar: getAvatarUrl('nova'),
    bio: 'Curator of forgotten sounds and magnetic tape artifacts.',
    location: 'Paris, FR',
    verusId: 'nova.s@'
  },
  reid: {
    id: 'u6',
    name: 'D. REID',
    handle: 'reid@',
    avatar: getAvatarUrl('reid'),
    bio: 'Vocalist and voice synthesis engineer bridging human and AI expression.',
    location: 'Los Angeles, US',
    verusId: 'reid.d@'
  },
  alex: {
    id: 'u7',
    name: 'ALEXIS',
    handle: 'alex@',
    avatar: getAvatarUrl('alex'),
    bio: 'Signal theorist focused on wave-based communication systems.',
    location: 'Stockholm, SE',
    verusId: 'alex.is@'
  },
  ross: {
    id: 'u8',
    name: 'M. ROSS',
    handle: 'ross@',
    avatar: getAvatarUrl('ross'),
    bio: 'Field recording specialist capturing the acoustic biology of extreme environments.',
    location: 'Reykjavík, IS',
    verusId: 'ross.m@'
  },
  luna: {
    id: 'u11',
    name: 'LUNA_T',
    handle: 'luna@',
    avatar: getAvatarUrl('luna'),
    bio: 'Ambient producer crafting ethereal textures for deep-spatial listening.',
    location: 'Oslo, NO',
    verusId: 'luna.t@'
  },
  cyber: {
    id: 'u10',
    name: 'CYBER',
    handle: 'cyber@',
    avatar: getAvatarUrl('cyber'),
    bio: 'Protocol architect and advocate for zero-knowledge media proof systems.',
    location: 'Global',
    verusId: 'cyber.id@'
  },
  dmode: {
    id: 'u11',
    name: 'D_MODE',
    handle: 'dmode@',
    avatar: getAvatarUrl('dmode'),
    bio: 'Industrial sound designer focusing on machine-human interface sonification.',
    location: 'Detroit, US',
    verusId: 'dmode.v@'
  },
  zerog: {
    id: 'u12',
    name: 'ZERO_G',
    handle: 'zerog@',
    avatar: getAvatarUrl('zerog'),
    bio: 'Audio-visual explorer utilizing blockchain-verified randomness in composition.',
    location: 'Mars Colony 1',
    verusId: 'zerog.node@'
  }
};

const assets: Asset[] = [
  { 
    id: '01', 
    title: 'Fragment_01', 
    fullName: 'Analog Warmth',
    description: 'A pure sawtooth wave processed through a vintage ladder filter.',
    val: '1.2 V', 
    type: 'image', 
    src: getPicsumUrl('asset01', 1000), 
    icon: Music,
    creator: profiles.katz,
    owner: profiles.katz
  },
  { 
    id: '02', 
    title: 'Fragment_02', 
    fullName: 'Industrial Pulse',
    description: 'Rythmic noise generated from deep-sea sonar signals.',
    val: '0.8 V', 
    type: 'image', 
    src: getPicsumUrl('asset02', 1000), 
    icon: Volume2,
    creator: profiles.mora,
    owner: profiles.mora
  },
  { 
    id: '03', 
    title: 'Fragment_03', 
    fullName: 'Ethical Core',
    description: 'Generative melody based on protocol consensus timestamps.',
    val: '2.5 V', 
    type: 'image', 
    src: getPicsumUrl('asset03', 1000), 
    icon: Shield,
    creator: profiles.chen,
    owner: profiles.chen
  },
  { 
    id: '04', 
    title: 'Stem_Archive', 
    fullName: 'Deep Space',
    description: 'Multi-track stems of the "Deep Space" performance, verified on-chain.',
    val: '4.2 V', 
    type: 'image', 
    src: getPicsumUrl('asset04', 1000), 
    icon: Headphones,
    creator: profiles.jax,
    owner: profiles.jax
  },
  { 
    id: '05', 
    title: 'Sonic_DNA', 
    fullName: 'Urban Decay',
    description: 'Field recordings of the city at 4 AM, granularly processed.',
    val: '1.8 V', 
    type: 'image', 
    src: getPicsumUrl('asset05', 1000), 
    icon: Mic,
    creator: profiles.nova,
    owner: profiles.reid
  },
  { 
    id: '06', 
    title: 'Vocal_Node', 
    fullName: 'Human Element',
    description: 'High-fidelity vocal takes for decentralized remixing.',
    val: '3.0 V', 
    type: 'image', 
    src: getPicsumUrl('asset06', 1000), 
    icon: Mic,
    creator: profiles.reid,
    owner: profiles.alex
  },
  { 
    id: '07', 
    title: 'Freq_Wave', 
    fullName: 'Voltage Control',
    description: 'Raw control voltage waveforms for modular environment syncing.',
    val: '0.9 V', 
    type: 'image', 
    src: getPicsumUrl('asset07', 1000), 
    icon: Zap,
    creator: profiles.alex,
    owner: profiles.ross
  },
  { 
    id: '08', 
    title: 'E_String_G', 
    fullName: 'Resonant Wood',
    description: 'High-definition string recordings with natural acoustic reverb.',
    val: '1.5 V', 
    type: 'image', 
    src: getPicsumUrl('asset08', 1000), 
    icon: Music,
    creator: profiles.ross,
    owner: profiles.luna
  },
  { 
    id: '09', 
    title: 'Grand_Ivory', 
    fullName: 'Pristine Keys',
    description: 'Sampled piano chords recorded in a cathedral environment.',
    val: '2.0 V', 
    type: 'image', 
    src: getPicsumUrl('asset09', 1000), 
    icon: Music,
    creator: profiles.luna,
    owner: profiles.cyber
  },
  { 
    id: '10', 
    title: 'Visual_FX', 
    fullName: 'Prism Stream',
    description: 'Generative visual artifacts reactive to sonic input.',
    val: '4.5 V', 
    type: 'video', 
    src: 'https://cdn.pixabay.com/video/2020/05/24/40108-423548943_tiny.mp4', 
    icon: Video,
    creator: profiles.cyber,
    owner: profiles.dmode
  },
  { 
    id: '11', 
    title: 'Deck_Set', 
    fullName: 'Turntable Physics',
    description: 'Real-time deck control protocols for digital performance.',
    val: '5.0 V', 
    type: 'video', 
    src: 'https://cdn.pixabay.com/video/2016/11/04/6257-189679117_tiny.mp4', 
    icon: Layers,
    creator: profiles.dmode,
    owner: profiles.zerog
  },
  { 
    id: '12', 
    title: 'Sonic_Core', 
    fullName: 'Artifact Hive',
    description: 'Centralized database of verified media fragments.',
    val: '9.9 V', 
    type: 'image', 
    src: getPicsumUrl('asset12', 1000), 
    icon: Database,
    creator: profiles.zerog,
    owner: profiles.katz
  },
];


export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [selectedArtist, setSelectedArtist] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'creations' | 'collection'>('creations');
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const isDragging = useRef(false);


  // Shuffled data for specific views
  const [displayAssets] = useState(() => [...assets].sort(() => Math.random() - 0.5));
  const [trendingNodes] = useState(() => 
    Object.values(profiles).sort(() => Math.random() - 0.5).slice(0, 5)
  );

  useEffect(() => {
    // Handle Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedArtist) {
        setSelectedArtist(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtist]);

  useEffect(() => {
    const updateConstraints = () => {
      if (shelfRef.current && containerRef.current) {
        const shelfWidth = shelfRef.current.scrollWidth;
        const containerWidth = containerRef.current.offsetWidth;
        setDragConstraints({
          left: -(shelfWidth - containerWidth),
          right: 0,
        });
      }
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-between p-8 md:p-16 overflow-hidden bg-black font-sans select-none">
      {/* Subtle Noise Texture Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.015] mix-blend-overlay" 
           style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

      {/* Very Subtle Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header: Minimal Status */}
      <div className="w-full flex justify-between items-center shrink-0 z-[60]">
        <div />
        <div className="flex items-center gap-2 label-mini opacity-60">
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <span className="text-white/70">Network_Live</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center gap-10 overflow-hidden max-w-7xl mx-auto px-4">
        
        {/* Top Centered Section: Trending Nodes */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-6 items-center shrink-0 w-full mt-4"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30">Trending Protocol Nodes</span>
          <div className="flex items-center gap-6 md:gap-10">
            {trendingNodes.map((profile) => (
              <motion.div 
                key={profile.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedArtist(profile)}
                className="relative cursor-pointer group flex flex-col items-center gap-3"
              >
                <img 
                  src={profile.avatar} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/5 grayscale group-hover:grayscale-0 object-cover transition-all duration-700" 
                  alt={profile.name} 
                  loading="lazy"
                  onError={e => (e.currentTarget.src = AVATAR_FALLBACK)}
                />
                <div className="text-[10px] text-white/40 group-hover:text-white transition-colors font-mono uppercase tracking-[0.2em]">
                  {profile.name}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="w-full h-px bg-white/5 max-w-4xl" />

        <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-24 overflow-visible">
          {/* Left Column: Brand + Hero */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left justify-center gap-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-heading italic uppercase leading-[0.85] tracking-tight shrink-0 text-white font-black mb-8">
                Own the <br />
                <span className="text-white/60">Fragment</span>
              </h1>

              {/* Injected Waitlist Component */}
              <div className="relative p-6 flex flex-col items-center md:items-start text-center md:text-left group bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.03] max-w-sm ml-[-4px]">
                <div className="relative z-10 flex flex-col items-center md:items-start w-full">
                  <div className="flex items-center gap-2 mb-4 opacity-50 group-hover:opacity-80 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white">Sequence_01_Init</span>
                  </div>
                  
                  <h2 className="text-xl font-heading italic uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors duration-1000 mb-2">
                    Coming Soon
                  </h2>

                  <p className="text-[10px] text-white/50 mb-6 font-mono max-w-[240px] leading-relaxed">
                    Join the protocol waitlist for early access to fragment minting.
                  </p>
                  
                  {/* Waitlist Input */}
                  <div className="w-full flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Join waitlist"
                      aria-label="Email for waitlist"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const btn = e.currentTarget.nextElementSibling as HTMLButtonElement;
                          btn?.click();
                        }
                      }}
                      disabled={waitlistStatus === 'loading'}
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-md px-3 py-2 text-[10px] text-white/70 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={() => {
                        if (waitlistEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                          setWaitlistStatus('loading');
                          setTimeout(() => {
                            setWaitlistStatus('success');
                            setWaitlistEmail('');
                            setTimeout(() => setWaitlistStatus('idle'), 3000);
                          }, 800);
                        } else {
                          setWaitlistStatus('error');
                          setTimeout(() => setWaitlistStatus('idle'), 2000);
                        }
                      }}
                      disabled={waitlistStatus === 'loading'}
                      className={`px-4 py-2 border rounded-md text-[9px] uppercase tracking-wider transition-all font-mono flex items-center gap-2 ${
                        waitlistStatus === 'success' 
                          ? 'border-green-500/50 text-green-400 bg-green-500/10'
                          : waitlistStatus === 'error'
                          ? 'border-red-500/50 text-red-400 bg-red-500/10'
                          : 'bg-white/10 hover:bg-white/20 border-white/20 text-white/70 hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {waitlistStatus === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {waitlistStatus === 'success' ? 'Joined!' : waitlistStatus === 'error' ? 'Invalid Email' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-w-xs md:max-w-sm space-y-6">
                <p className="text-[15px] text-white/70 font-light leading-relaxed italic">
                  Decentralized modular media ownership. High-fidelity audio artifacts secured via Verus technology.
                </p>
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-6 h-px bg-white/40" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/80">Infinitely Scalable</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interaction shelf */}
          <div className="flex-1 w-full max-w-lg flex flex-col gap-6 justify-center min-h-0 overflow-hidden">
            {/* Integrated Marketplace Shelf */}
            <div className="flex-1 min-h-0 overflow-visible relative flex items-center" ref={containerRef}>
              <motion.div 
                ref={shelfRef}
                drag="x"
                onDragStart={() => {
                  isDragging.current = true;
                }}
                onDragEnd={() => {
                  setTimeout(() => {
                    isDragging.current = false;
                  }, 100);
                }}
                dragConstraints={dragConstraints}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-12 cursor-grab active:cursor-grabbing py-12 items-center"
              >
                {displayAssets.map((asset) => (
                  <div 
                    key={asset.id} 
                    className="flex-none w-56 group cursor-pointer"
                    onClick={() => {
                      if (!isDragging.current) {
                        setSelectedArtist(asset.creator);
                      }
                    }}
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 shadow-2xl transition-all duration-700 group-hover:scale-[1.03] group-hover:shadow-white/[0.05]">
                      {/* Type badge */}
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-[8px] uppercase tracking-wider text-white/70 font-mono z-10">
                        {asset.type}
                      </div>

                      {asset.type === 'video' ? (
                        <video src={asset.src} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={asset.src} alt={asset.title} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      
                    </div>

                    <div className="space-y-2 px-1">
                      <h3 className="text-[14px] font-bold text-white/90 truncate group-hover:text-white transition-colors uppercase tracking-tight">
                        {asset.fullName}
                      </h3>
                      <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] flex items-center gap-2 font-mono">
                         <img 
                           src={asset.creator.avatar}
                           alt={asset.creator.verusId}
                           className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                           loading="lazy"
                           onError={e => (e.currentTarget.src = AVATAR_FALLBACK)}
                         />
                         <span className="text-white/70">{asset.creator.verusId}</span>
                         <span className="w-1 h-1 rounded-full bg-white/10" />
                         <span className="italic">Protocol v1.2</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedArtist && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/85 backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedArtist(null);
              }
            }}
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-neutral-900 border border-white/5 p-8 md:p-10 rounded-2xl relative overflow-hidden flex flex-col items-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedArtist(null)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors z-20"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 w-full flex flex-col items-center">
                <div className="mb-6">
                  <img 
                    src={selectedArtist.avatar} 
                    alt=""
                    className="w-20 h-20 rounded-full object-cover border border-white/10 grayscale"
                    loading="lazy"
                    onError={e => (e.currentTarget.src = AVATAR_FALLBACK)}
                  />
                </div>

                <h2 id="modal-title" className="text-2xl font-heading italic uppercase text-white mb-2 tracking-tight">
                  {selectedArtist.name}
                </h2>
                <div className="flex flex-col items-center gap-4 mb-8">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em] bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
                    {selectedArtist.verusId}
                  </span>
                  
                  <button 
                    onClick={() => {
                      const newFollowed = new Set(followedUsers);
                      if (newFollowed.has(selectedArtist.id)) {
                        newFollowed.delete(selectedArtist.id);
                      } else {
                        newFollowed.add(selectedArtist.id);
                      }
                      setFollowedUsers(newFollowed);
                    }}
                    className={`text-[9px] uppercase tracking-[0.3em] font-bold py-2 px-6 rounded-md border transition-all duration-500 ${
                      followedUsers.has(selectedArtist.id) 
                        ? 'border-white/10 text-white/40 hover:text-white/60' 
                        : 'border-white/40 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {followedUsers.has(selectedArtist.id) ? 'Following' : 'Follow Artist'}
                  </button>
                </div>

                <p className="text-[14px] text-white/70 font-light text-center max-w-sm mb-12 leading-relaxed italic">
                  "{selectedArtist.bio}"
                </p>

                <div className="flex items-center gap-8 mb-10 w-full justify-center border-b border-white/[0.02]">
                  <button 
                    onClick={() => setActiveTab('creations')}
                    className={`pb-4 text-[10px] uppercase tracking-[0.3em] transition-all relative font-bold ${activeTab === 'creations' ? 'text-white' : 'text-white/20'}`}
                  >
                    Creations
                    {activeTab === 'creations' && <motion.div layoutId="tab" className="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white/60" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('collection')}
                    className={`pb-4 text-[10px] uppercase tracking-[0.3em] transition-all relative font-bold ${activeTab === 'collection' ? 'text-white' : 'text-white/20'}`}
                  >
                    Collection
                    {activeTab === 'collection' && <motion.div layoutId="tab" className="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white/60" />}
                  </button>
                </div>

                {/* Simplified Grid View */}
                <div className="w-full h-64 overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-2 gap-3 w-full"
                    >
                      {assets.filter(a => activeTab === 'creations' ? a.creator.id === selectedArtist.id : a.owner.id === selectedArtist.id).map((asset) => (
                        <motion.div 
                          key={asset.id} 
                          className="group relative aspect-square rounded-lg overflow-hidden bg-white/[0.02]"
                        >
                          <img src={asset.src} className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700" alt={asset.title} loading="lazy" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 w-full flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 opacity-40 text-white" />
                    <span>{selectedArtist.location}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <Twitter className="w-4 h-4 hover:text-white transition-colors cursor-pointer opacity-60 hover:opacity-100" />
                    <Disc className="w-4 h-4 hover:text-white transition-colors cursor-pointer opacity-60 hover:opacity-100" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

