/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe,
  Disc,
  X,
  Loader2,
  Twitter,
} from 'lucide-react';
import MediaShowcase from './components/MediaShowcase';

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
  creator: UserProfile;
  owner: UserProfile;
}

// Helper function to generate consistent placeholder images
const getPicsumUrl = (seed: string, width: number, height: number = width) => 
  `https://picsum.photos/${width}/${height}?random=${seed}`;

// Creator portrait set for showcase.
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
    bio: 'Generative artist exploring the intersection of code, color, and visual expression.',
    location: 'Berlin, DE',
    verusId: 'katz.v@'
  },
  mora: {
    id: 'u2',
    name: 'E. MORA',
    handle: 'mora@',
    avatar: getAvatarUrl('mora'),
    bio: 'Designer of immersive digital spaces and interactive virtual environments.',
    location: 'Tokyo, JP',
    verusId: 'mora.e@'
  },
  chen: {
    id: 'u3',
    name: 'L. CHEN',
    handle: 'chen@',
    avatar: getAvatarUrl('chen'),
    bio: 'Writer and visual artist specializing in generative text and interactive narratives.',
    location: 'Seoul, KR',
    verusId: 'chen.l@'
  },
  jax: {
    id: 'u4',
    name: 'B. JAX',
    handle: 'jaxx@',
    avatar: getAvatarUrl('jax'),
    bio: 'Protocol designer building decentralized collaboration frameworks for creators.',
    location: 'London, UK',
    verusId: 'jax.b@'
  },
  nova: {
    id: 'u5',
    name: 'S. NOVA',
    handle: 'nova@',
    avatar: getAvatarUrl('nova'),
    bio: 'Curator and essayist exploring the cultural impact of digital preservation.',
    location: 'Paris, FR',
    verusId: 'nova.s@'
  },
  reid: {
    id: 'u6',
    name: 'D. REID',
    handle: 'reid@',
    avatar: getAvatarUrl('reid'),
    bio: 'Narrative designer bridging human storytelling and AI-mediated expression.',
    location: 'Los Angeles, US',
    verusId: 'reid.d@'
  },
  alex: {
    id: 'u7',
    name: 'ALEXIS',
    handle: 'alex@',
    avatar: getAvatarUrl('alex'),
    bio: 'Systems architect focused on decentralized communication protocols.',
    location: 'Stockholm, SE',
    verusId: 'alex.is@'
  },
  ross: {
    id: 'u8',
    name: 'M. ROSS',
    handle: 'ross@',
    avatar: getAvatarUrl('ross'),
    bio: 'Visual storyteller documenting the intersection of nature and technology.',
    location: 'Reykjavík, IS',
    verusId: 'ross.m@'
  },
  luna: {
    id: 'u11',
    name: 'LUNA_T',
    handle: 'luna@',
    avatar: getAvatarUrl('luna'),
    bio: 'Experience designer crafting ethereal digital spaces for deep immersion.',
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
    bio: 'Interactive installation artist exploring machine-human creative interfaces.',
    location: 'Detroit, US',
    verusId: 'dmode.v@'
  },
  zerog: {
    id: 'u12',
    name: 'ZERO_G',
    handle: 'zerog@',
    avatar: getAvatarUrl('zerog'),
    bio: 'Multi-disciplinary creator utilizing blockchain-verified provenance across all works.',
    location: 'Mars Colony 1',
    verusId: 'zerog.node@'
  }
};

const assets: Asset[] = [
  { 
    id: '01', 
    title: 'GEN_01', 
    fullName: 'Analog Warmth',
    description: 'A generative visual study of analog texture through digital precision.',
    val: '1.2 V', 
    type: 'image', 
    src: getPicsumUrl('asset01', 1000), 
    creator: profiles.katz,
    owner: profiles.katz
  },
  { 
    id: '02', 
    title: 'VIZ_02', 
    fullName: 'Industrial Pulse',
    description: 'Data visualization generated from deep-sea sensor telemetry.',
    val: '0.8 V', 
    type: 'image', 
    src: getPicsumUrl('asset02', 1000), 
    creator: profiles.mora,
    owner: profiles.mora
  },
  { 
    id: '03', 
    title: 'CORE_03', 
    fullName: 'Ethical Core',
    description: 'Generative artwork based on protocol consensus timestamps.',
    val: '2.5 V', 
    type: 'image', 
    src: getPicsumUrl('asset03', 1000), 
    creator: profiles.chen,
    owner: profiles.chen
  },
  { 
    id: '04', 
    title: 'ARCH_04', 
    fullName: 'Deep Space',
    description: 'Multi-layer creative assets of the "Deep Space" project, verified on-chain.',
    val: '4.2 V', 
    type: 'image', 
    src: getPicsumUrl('asset04', 1000), 
    creator: profiles.jax,
    owner: profiles.jax
  },
  { 
    id: '05', 
    title: 'URBAN_05', 
    fullName: 'Urban Decay',
    description: 'Photo essay documenting the city at 4 AM, digitally processed.',
    val: '1.8 V', 
    type: 'image', 
    src: getPicsumUrl('asset05', 1000), 
    creator: profiles.nova,
    owner: profiles.reid
  },
  { 
    id: '06', 
    title: 'NODE_06', 
    fullName: 'Human Element',
    description: 'High-fidelity creative assets for decentralized collaboration.',
    val: '3.0 V', 
    type: 'image', 
    src: getPicsumUrl('asset06', 1000), 
    creator: profiles.reid,
    owner: profiles.alex
  },
  { 
    id: '07', 
    title: 'WAVE_07', 
    fullName: 'Voltage Control',
    description: 'Interactive visual system for real-time collaborative creation.',
    val: '0.9 V', 
    type: 'image', 
    src: getPicsumUrl('asset07', 1000), 
    creator: profiles.alex,
    owner: profiles.ross
  },
  { 
    id: '08', 
    title: 'TEXT_08', 
    fullName: 'Resonant Wood',
    description: 'High-definition digital capture of natural organic textures.',
    val: '1.5 V', 
    type: 'image', 
    src: getPicsumUrl('asset08', 1000), 
    creator: profiles.ross,
    owner: profiles.luna
  },
  { 
    id: '09', 
    title: 'PIXEL_09', 
    fullName: 'Pristine Keys',
    description: 'Digital composition rendered from spatial environmental data.',
    val: '2.0 V', 
    type: 'image', 
    src: getPicsumUrl('asset09', 1000), 
    creator: profiles.luna,
    owner: profiles.cyber
  },
  { 
    id: '10', 
    title: 'PRISM_10', 
    fullName: 'Prism Stream',
    description: 'Generative visual artifacts reactive to environmental data.',
    val: '4.5 V', 
    type: 'video', 
    src: getPicsumUrl('asset10', 1000), 
    creator: profiles.cyber,
    owner: profiles.dmode
  },
  { 
    id: '11', 
    title: 'PHYS_11', 
    fullName: 'Turntable Physics',
    description: 'Real-time creative control protocols for digital performance.',
    val: '5.0 V', 
    type: 'video', 
    src: getPicsumUrl('asset11', 1000), 
    creator: profiles.dmode,
    owner: profiles.zerog
  },
  { 
    id: '12', 
    title: 'HIVE_12', 
    fullName: 'Artifact Hive',
    description: 'Curated collection of verified creative works across all media.',
    val: '9.9 V', 
    type: 'image', 
    src: getPicsumUrl('asset12', 1000), 
    creator: profiles.zerog,
    owner: profiles.katz
  },
];


export default function App() {
  const [selectedArtist, setSelectedArtist] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'creations' | 'collection'>('creations');
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showVerusInfo, setShowVerusInfo] = useState(false);
  const verusInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedArtist) {
        setSelectedArtist(null);
      }
      if (e.key === 'Escape' && showVerusInfo) {
        setShowVerusInfo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtist, showVerusInfo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (verusInfoRef.current && !verusInfoRef.current.contains(e.target as Node)) {
        setShowVerusInfo(false);
      }
    };
    if (showVerusInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVerusInfo]);


  return (
    <main className="min-h-screen w-screen relative bg-black font-sans">
      {/* Ambient gradient orb */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full pointer-events-none opacity-20 animate-ambient-float"
           style={{
             background: 'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
           }} />

      {/* Subtle Noise Texture Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.015] mix-blend-overlay" 
           style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

      {/* Very Subtle Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* LEFT PANEL: Sticky Hero */}
        <div className="relative z-10 w-full lg:w-[38%] lg:sticky lg:top-0 lg:h-screen flex flex-col p-6 lg:p-10">
          {/* Header: Minimal Status */}
          <div className="w-full shrink-0">
            <div className="flex items-center gap-2 label-mini opacity-60">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <span className="text-white/50 font-light">Network_Live</span>
            </div>
          </div>

          {/* Headline + Features */}
          <div className="flex-1 flex flex-col justify-center gap-10 lg:gap-16 py-8 lg:py-0">
            <h1 className="text-[clamp(2.7rem,5.4vw,4.05rem)] font-heading uppercase leading-[0.9] tracking-tight text-white">
              Unleash your imagination,<br />
              <span className="text-white/60 block mt-2">Own forever.</span>
            </h1>

            {/* Feature bullets */}
            <div className="space-y-2.5 max-w-xs">
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                <p className="text-caption text-white/50 font-sans leading-relaxed">Creators publish content on-chain and earn royalties instantly, forever.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                <p className="text-caption text-white/50 font-sans leading-relaxed">Audiences discover and collect verified digital works of any kind.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                <p className="text-caption text-white/50 font-sans leading-relaxed">
                  Built on&nbsp;
                  <span className="relative inline-flex items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowVerusInfo(!showVerusInfo); }}
                      className="text-white/70 hover:text-white transition-colors underline underline-offset-2 decoration-white/20 decoration-dotted cursor-pointer"
                    >
                      Verus
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowVerusInfo(!showVerusInfo); }}
                      className="ml-0.5 text-white/30 hover:text-white/60 transition-colors text-[10px] leading-none cursor-pointer"
                      aria-label="What is Verus?"
                    >ⓘ</button>
                    <AnimatePresence>
                      {showVerusInfo && (
                        <motion.div 
                          ref={verusInfoRef}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-3 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50"
                        >
                          <p className="text-caption text-white/70 font-sans leading-relaxed">
                            A blockchain protocol for identities, payments, and fair consensus — no mining fees, instant settlements. For VerusStream, this means automatic royalty payouts and verifiable content ownership.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </span>
                  &nbsp;— decentralized, secure, and fair.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA: Waitlist + How It Works */}
          <div className="space-y-5 shrink-0">
            {/* Waitlist */}
            <div>
              <h2 className="text-h2 font-heading tracking-[-0.02em] text-white/80 mb-2">
                Coming Soon
              </h2>
              <p className="text-caption text-white/50 mb-4 font-sans max-w-[240px] leading-relaxed">
                Join creators getting early access.
              </p>
              <div className="w-full flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address"
                  aria-label="Email for waitlist"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.nextElementSibling?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }
                  }}
                  disabled={waitlistStatus === 'loading'}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-caption text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors font-sans disabled:opacity-50"
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
                  className={`px-4 py-2.5 border rounded-lg text-micro uppercase transition-all font-sans flex items-center gap-1.5 ${
                    waitlistStatus === 'success' 
                      ? 'border-green-500/40 text-green-400'
                      : waitlistStatus === 'error'
                      ? 'border-red-500/40 text-red-400'
                      : 'border-white/[0.15] text-white/80 hover:bg-white hover:text-black hover:border-white'
                  } disabled:opacity-50`}
                >
                  {waitlistStatus === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {waitlistStatus === 'success' ? 'Joined' : waitlistStatus === 'error' ? 'Invalid' : 'Join'}
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-micro font-heading uppercase tracking-[0.15em] text-white/20">How It Works</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pb-2">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-caption font-heading text-white/70 mb-1">Create</div>
                <div className="text-micro text-white/30 leading-relaxed">Produce content and register it on the Verus blockchain.</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-caption font-heading text-white/70 mb-1">Publish</div>
                <div className="text-micro text-white/30 leading-relaxed">Share with the world — your work is verifiable and permanent.</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-caption font-heading text-white/70 mb-1">Earn</div>
                <div className="text-micro text-white/30 leading-relaxed">Receive royalties instantly on every resale, forever.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Scrollable Showcase */}
        <div className="relative z-10 w-full lg:w-[62%]">
          <MediaShowcase />
          {/* Footer */}
          <div className="px-6 lg:px-10 pb-8 pt-4 border-t border-white/[0.04] mt-8 flex items-center justify-between text-micro text-white/30">
            <span>Powered by Verus Blockchain</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white/60 transition-colors">Twitter</a>
              <a href="#" className="hover:text-white/60 transition-colors">Discord</a>
              <a href="#" className="hover:text-white/60 transition-colors">Docs</a>
            </div>
          </div>
        </div>
      </div>
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

                <h2 id="modal-title" className="text-h2 font-heading uppercase text-white mb-2">
                  {selectedArtist.name}
                </h2>
                <div className="flex flex-col items-center gap-4 mb-8">
                  <span className="text-caption font-heading uppercase tracking-[0.1em] text-white/40 bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
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
                    className={`text-micro font-heading uppercase tracking-[0.1em] py-2 px-6 rounded-md border transition-all duration-500 ${
                      followedUsers.has(selectedArtist.id) 
                        ? 'border-white/10 text-white/40 hover:text-white/60' 
                        : 'border-white/40 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {followedUsers.has(selectedArtist.id) ? 'Following' : 'Follow Creator'}
                  </button>
                </div>

                <p className="text-body text-white/70 font-light text-center max-w-sm mb-12 leading-relaxed italic">
                  "{selectedArtist.bio}"
                </p>

                <div className="flex items-center gap-8 mb-10 w-full justify-center border-b border-white/[0.02]">
                  <button 
                    onClick={() => setActiveTab('creations')}
                    className={`pb-4 text-caption font-heading uppercase tracking-[0.1em] transition-all relative ${activeTab === 'creations' ? 'text-white' : 'text-white/20'}`}
                  >
                    Creations
                    {activeTab === 'creations' && <motion.div layoutId="tab" className="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white/60" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('collection')}
                    className={`pb-4 text-caption font-heading uppercase tracking-[0.1em] transition-all relative ${activeTab === 'collection' ? 'text-white' : 'text-white/20'}`}
                  >
                    Collection
                    {activeTab === 'collection' && <motion.div layoutId="tab" className="absolute bottom-[-1px] inset-x-0 h-[2px] bg-white/60" />}
                  </button>
                </div>

                {/* Simplified Grid View */}
                <div className="w-full h-72 overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
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

                <div className="mt-10 pt-8 border-t border-white/5 w-full flex justify-between items-center text-caption font-sans uppercase tracking-[0.08em] text-white/40">
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
    </main>
  );
}

