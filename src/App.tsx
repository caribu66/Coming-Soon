/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe,
  Disc,
  X,
  Loader2,
  Twitter,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
} from 'lucide-react';
import MediaShowcase from './components/MediaShowcase';
import InboxView from './components/InboxView';

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

interface VerusSubscriber {
  verusId: string;
  createdAt: string;
}

interface VerusInboxMessage {
  id: string;
  recipientVerusId: string;
  subject: string;
  body: string;
  channel: string;
  createdAt: string;
  verified: boolean;
  status: string;
  signerIdentity?: string;
  signature?: string;
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
const VERUS_SUBSCRIBERS_KEY = 'coming-soon:verus-subscribers';

const getAvatarUrl = (seed: string) => avatarBySeed[seed] ?? AVATAR_FALLBACK;
const normalizeVerusId = (value: string) => value.trim().replace(/\s+/g, '');
const isValidVerusId = (value: string) => {
  const normalized = normalizeVerusId(value);
  return /^(i[a-zA-Z0-9]{20,}|[A-Za-z0-9._-]+@)$/.test(normalized);
};

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
  const [waitlistVerusId, setWaitlistVerusId] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verusSubscribers, setVerusSubscribers] = useState<VerusSubscriber[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [inboxVerusId, setInboxVerusId] = useState('');
  const [inboxChallenge, setInboxChallenge] = useState('');
  const [inboxRequestUri, setInboxRequestUri] = useState('');
  const [inboxQrDataUrl, setInboxQrDataUrl] = useState('');
  const [inboxSignature, setInboxSignature] = useState('');
  const [inboxMessages, setInboxMessages] = useState<VerusInboxMessage[]>([]);
  const [inboxStatus, setInboxStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [inboxNotice, setInboxNotice] = useState('');
  const [inboxUnlocked, setInboxUnlocked] = useState(false);
  const [expandedSignatures, setExpandedSignatures] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'main' | 'inbox'>('main');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [inboxSearchQuery, setInboxSearchQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [inboxPage, setInboxPage] = useState(1);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showVerusInfo, setShowVerusInfo] = useState(false);
  const MESSAGES_PER_PAGE = 20;
  const verusInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        const response = await fetch('/api/verus/subscribers');
        if (!response.ok) throw new Error('Unable to load Verus subscribers');

        const data = await response.json() as { subscribers?: VerusSubscriber[] };
        if (Array.isArray(data.subscribers)) {
          setVerusSubscribers(
            data.subscribers.filter(item => typeof item?.verusId === 'string' && typeof item?.createdAt === 'string')
          );
          return;
        }
      } catch {
        const saved = window.localStorage.getItem(VERUS_SUBSCRIBERS_KEY);
        if (!saved) return;

        try {
          const parsed = JSON.parse(saved) as VerusSubscriber[];
          if (Array.isArray(parsed)) {
            setVerusSubscribers(
              parsed.filter(item => typeof item?.verusId === 'string' && typeof item?.createdAt === 'string')
            );
          }
        } catch {
          window.localStorage.removeItem(VERUS_SUBSCRIBERS_KEY);
        }
      }
    };

    void loadSubscribers();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VERUS_SUBSCRIBERS_KEY, JSON.stringify(verusSubscribers));
  }, [verusSubscribers]);

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

  const handleVerusSubscribe = async () => {
    const normalized = normalizeVerusId(waitlistVerusId);

    if (!isValidVerusId(normalized)) {
      setWaitlistStatus('error');
      window.setTimeout(() => setWaitlistStatus('idle'), 2000);
      return;
    }

    setWaitlistStatus('loading');

    try {
      const response = await fetch('/api/verus/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verusId: normalized }),
      });

      const data = await response.json() as {
        ok?: boolean;
        subscriber?: VerusSubscriber & { verified?: boolean; identityName?: string | null; verificationError?: string | null; };
        rpcVerified?: boolean;
        rpcError?: string | null;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.subscriber) {
        throw new Error(data.error || data.rpcError || 'Unable to save Verus subscriber');
      }

      setVerusSubscribers(current => {
        if (current.some(entry => entry.verusId === normalized)) {
          return current;
        }
        return [data.subscriber as VerusSubscriber, ...current];
      });
      setWaitlistVerusId('');
      setWaitlistStatus('success');
      window.setTimeout(() => setWaitlistStatus('idle'), 3000);
    } catch {
      setWaitlistStatus('error');
      window.setTimeout(() => setWaitlistStatus('idle'), 2500);
    }
  };

  const handleVerusBroadcast = async () => {
    if (verusSubscribers.length === 0) {
      setBroadcastStatus('error');
      window.setTimeout(() => setBroadcastStatus('idle'), 2000);
      return;
    }

    setBroadcastStatus('loading');

    try {
      const response = await fetch('/api/verus/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Coming Soon launch update',
          message: 'You are on the Verus subscriber list. Launch updates will arrive through VerusID instead of email.',
        }),
      });

      const data = await response.json() as { ok?: boolean; delivered?: number; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to queue Verus broadcast');
      }

      setBroadcastStatus('success');
      window.setTimeout(() => setBroadcastStatus('idle'), 2500);
    } catch {
      setBroadcastStatus('error');
      window.setTimeout(() => setBroadcastStatus('idle'), 2500);
    }
  };

  useEffect(() => {
    if (!inboxQrDataUrl) return;

    const normalized = normalizeVerusId(inboxVerusId);
    if (!isValidVerusId(normalized)) return;

    let cancelled = false;

    const poll = async () => {
      while (!cancelled) {
        try {
          const response = await fetch(`/api/verus/inbox/poll?verusId=${encodeURIComponent(normalized)}`);
          const data = await response.json() as { ok?: boolean; unlocked?: boolean; messages?: VerusInboxMessage[] };
          if (data.unlocked) {
            setInboxMessages(data.messages || []);
            setInboxUnlocked(true);
            setInboxNotice(`Inbox unlocked: ${(data.messages || []).length} message(s)`);
            setInboxStatus('success');
            return;
          }
        } catch {
          // ignore
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    };

    poll();

    return () => { cancelled = true; };
  }, [inboxQrDataUrl, inboxVerusId]);

  useEffect(() => {
    if (inboxUnlocked) {
      setView('inbox');
      setShowQrModal(false);
    }
  }, [inboxUnlocked]);

  useEffect(() => {
    if (!inboxVerusId) return;
    const key = `verus-inbox-read-${normalizeVerusId(inboxVerusId)}`;
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed)) setReadMessageIds(new Set(parsed));
      }
    } catch {}
  }, [inboxVerusId]);

  useEffect(() => {
    if (!inboxVerusId) return;
    try {
      window.localStorage.setItem(
        `verus-inbox-read-${normalizeVerusId(inboxVerusId)}`,
        JSON.stringify([...readMessageIds])
      );
    } catch {}
  }, [readMessageIds, inboxVerusId]);

  const handleRequestInboxChallenge = async () => {
    const normalized = normalizeVerusId(inboxVerusId);

    if (!isValidVerusId(normalized)) {
      setInboxNotice('Enter a valid VerusID or i-address first.');
      setInboxStatus('error');
      window.setTimeout(() => setInboxStatus('idle'), 2000);
      return;
    }

    setInboxStatus('loading');
    setInboxNotice('Requesting wallet challenge...');

    try {
      const response = await fetch('/api/verus/inbox/decrypt-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verusId: normalized }),
      });
      const data = await response.json() as {
        ok?: boolean;
        verusId?: string;
        requestUri?: string;
        qrDataUrl?: string;
        requestID?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.requestUri) {
        throw new Error(data.error || 'Unable to request unlock challenge');
      }

      setInboxVerusId(data.verusId || normalized);
      setInboxChallenge(data.requestID || '');
      setInboxRequestUri(data.requestUri || '');
      setInboxQrDataUrl(data.qrDataUrl || '');
      setInboxSignature('');
      setInboxMessages([]);
      setInboxNotice('Scan the QR in Verus Mobile, then approve the request.');
      setInboxStatus('success');
      setShowQrModal(true);
      window.setTimeout(() => setInboxStatus('idle'), 2500);
    } catch (error) {
      setInboxNotice(error instanceof Error ? error.message : 'Unable to request unlock challenge.');
      setInboxStatus('error');
      window.setTimeout(() => setInboxStatus('idle'), 2500);
    }
  };

  const handleUnlockInbox = async () => {
    const normalized = normalizeVerusId(inboxVerusId);

    try {
      const response = await fetch(`/api/verus/inbox/poll?verusId=${encodeURIComponent(normalized)}`);
      const data = await response.json() as { ok?: boolean; unlocked?: boolean; messages?: VerusInboxMessage[]; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to unlock inbox');
      }

      if (data.unlocked) {
        setInboxVerusId(normalized);
        setInboxMessages(Array.isArray(data.messages) ? data.messages : []);
        setInboxUnlocked(true);
        setInboxNotice(`Inbox unlocked: ${Array.isArray(data.messages) ? data.messages.length : 0} message(s)`);
        setInboxStatus('success');
        return;
      }

      setInboxNotice('Wallet approval still pending. Keep the modal open and approve the request in Verus Mobile.');
      setInboxStatus('idle');
    } catch (error) {
      setInboxNotice(error instanceof Error ? error.message : 'Unable to unlock inbox.');
      setInboxStatus('error');
      window.setTimeout(() => setInboxStatus('idle'), 2500);
    }
  };

  const handleLockInbox = () => {
    void fetch(`/api/verus/inbox/lock?verusId=${encodeURIComponent(normalizeVerusId(inboxVerusId))}`);
    setInboxVerusId('');
    setInboxChallenge('');
    setInboxRequestUri('');
    setInboxQrDataUrl('');
    setInboxSignature('');
    setInboxMessages([]);
    setInboxNotice('');
    setInboxStatus('idle');
    setInboxUnlocked(false);
    setExpandedSignatures(new Set());
  };

  const toggleSignature = (id: string) => {
    setExpandedSignatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const filteredMessages = useMemo(() => {
    let msgs = inboxMessages;
    if (inboxFilter === 'verified') msgs = msgs.filter(m => m.verified);
    if (inboxFilter === 'unverified') msgs = msgs.filter(m => !m.verified);
    if (inboxSearchQuery) {
      const q = inboxSearchQuery.toLowerCase();
      msgs = msgs.filter(m => m.subject.toLowerCase().includes(q) || m.body.toLowerCase().includes(q));
    }
    return msgs;
  }, [inboxMessages, inboxFilter, inboxSearchQuery]);

  const totalPages = Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE);
  const paginatedMessages = useMemo(
    () => filteredMessages.slice((inboxPage - 1) * MESSAGES_PER_PAGE, inboxPage * MESSAGES_PER_PAGE),
    [filteredMessages, inboxPage]
  );

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
            {/* Verus subscription */}
            <div>
              <h2 className="text-h2 font-heading tracking-[-0.02em] text-white/80 mb-2">
                Verus-native alerts
              </h2>
              <p className="text-caption text-white/50 mb-4 font-sans max-w-[240px] leading-relaxed">
                Get release updates through your VerusID instead of email.
              </p>
              <div className="w-full flex gap-2">
                <input 
                 type="text"
                 placeholder="VerusID or i-address"
                 aria-label="VerusID for waitlist"
                 value={waitlistVerusId}
                 onChange={(e) => setWaitlistVerusId(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handleVerusSubscribe();
                   }
                 }}
                 disabled={waitlistStatus === 'loading'}
                 className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-caption text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors font-sans disabled:opacity-50"
              />
              <button 
                 onClick={handleVerusSubscribe}
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
                  {waitlistStatus === 'success' ? 'Saved' : waitlistStatus === 'error' ? 'Invalid' : 'Send'}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-white/35">
                <ShieldCheck className="w-3 h-3" />
                <span>VerusID messages can be signed and delivered through your wallet.</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-white/25">
                  <Wallet className="w-3 h-3" />
                  <span>Saved Verus subscribers</span>
                </div>
                {verusSubscribers.length > 0 ? (
                  <div className="space-y-1">
                    {verusSubscribers.slice(0, 3).map((subscriber) => (
                      <div key={subscriber.verusId} className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                        <span className="text-caption text-white/70 font-sans truncate">{subscriber.verusId}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/30 font-sans">
                    Add a VerusID first to enable test alerts.
                  </p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-white/25">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Inbox viewer</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VerusID to unlock"
                    aria-label="VerusID inbox unlock"
                    value={inboxVerusId}
                    onChange={(e) => setInboxVerusId(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-caption text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleRequestInboxChallenge}
                    disabled={inboxStatus === 'loading'}
                    className="px-4 py-2.5 border rounded-lg text-micro uppercase transition-all font-sans border-white/[0.15] text-white/80 hover:bg-white hover:text-black hover:border-white disabled:opacity-50"
                  >
                    {inboxStatus === 'loading' ? 'Loading' : 'Challenge'}
                  </button>
                </div>
                {inboxNotice && (
                  <div className={`text-[11px] font-sans leading-relaxed ${inboxStatus === 'error' ? 'text-red-400' : inboxStatus === 'success' ? 'text-green-300' : 'text-white/40'}`}>
                    {inboxNotice}
                  </div>
                )}
                {!inboxQrDataUrl && !inboxNotice && (
                  <p className="text-[11px] text-white/30 font-sans">
                    Request a challenge, sign it in your Verus wallet, and unlock the inbox.
                  </p>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-micro font-heading uppercase tracking-[0.15em] text-white/20">How It Works</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pb-2">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-caption font-heading text-white/70 mb-1">Subscribe</div>
                <div className="text-micro text-white/30 leading-relaxed">Users save a VerusID instead of an email address.</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-caption font-heading text-white/70 mb-1">Sign</div>
                <div className="text-micro text-white/30 leading-relaxed">Announcements are signed with VerusID messages or requests.</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-caption font-heading text-white/70 mb-1">Deliver</div>
                <div className="text-micro text-white/30 leading-relaxed">Optional encrypted payloads can be handed to the wallet later.</div>
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
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
            onClick={(e) => { if (e.target === e.currentTarget) setShowQrModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm bg-neutral-900 border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
                aria-label="Close QR modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/25 mb-3 font-sans">Scan with Verus Mobile</div>
                {inboxQrDataUrl && (
                  <img
                    src={inboxQrDataUrl}
                    alt="Verus wallet challenge QR"
                    className="w-48 h-48 rounded-xl border border-white/10 bg-white p-3"
                  />
                )}
                <div className="mt-3 text-[11px] text-white/55 font-sans text-center leading-relaxed">
                  Open Verus Mobile, scan the QR, and approve the request to unlock your inbox.
                </div>
                <div className="mt-4 w-full">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/25 mb-1.5 font-sans">Request ID</div>
                  <div className="whitespace-pre-wrap break-words text-[10px] text-white/40 font-mono bg-black/30 rounded-lg p-2.5 border border-white/[0.04] max-h-20 overflow-y-auto select-all">
                    {typeof inboxChallenge === 'string' ? inboxChallenge : JSON.stringify(inboxChallenge)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockInbox}
                  disabled={inboxStatus === 'loading'}
                  className="mt-4 w-full rounded-lg border border-white/[0.15] bg-white px-4 py-2.5 text-micro uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/90 disabled:opacity-50"
                >
                  {inboxStatus === 'loading' ? 'Checking' : 'Check inbox'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {view === 'inbox' && (
          <motion.div
            key="inbox-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <InboxView
              messages={paginatedMessages}
              allCount={filteredMessages.length}
              totalPages={totalPages}
              currentPage={inboxPage}
              selectedMessageId={selectedMessageId}
              readMessageIds={readMessageIds}
              searchQuery={inboxSearchQuery}
              filter={inboxFilter}
              verusId={inboxVerusId}
              expandedSignatures={expandedSignatures}
              onSelectMessage={(id) => {
                setSelectedMessageId(id);
                setReadMessageIds(prev => new Set(prev).add(id));
              }}
              onBack={() => {
                setView('main');
                handleLockInbox();
              }}
              onSearchChange={(q) => { setInboxSearchQuery(q); setInboxPage(1); }}
              onFilterChange={(f) => { setInboxFilter(f); setInboxPage(1); }}
              onPageChange={setInboxPage}
              onToggleSignature={toggleSignature}
              formatRelativeTime={formatRelativeTime}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
