import { ArrowLeft, Search, ChevronLeft, ChevronRight, Copy, CheckCircle2 } from 'lucide-react';

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

interface Props {
  messages: VerusInboxMessage[];
  allCount: number;
  totalPages: number;
  currentPage: number;
  selectedMessageId: string | null;
  readMessageIds: Set<string>;
  searchQuery: string;
  filter: 'all' | 'verified' | 'unverified';
  verusId: string;
  expandedSignatures: Set<string>;
  onSelectMessage: (id: string) => void;
  onBack: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: 'all' | 'verified' | 'unverified') => void;
  onPageChange: (page: number) => void;
  onToggleSignature: (id: string) => void;
  formatRelativeTime: (iso: string) => string;
}

const FILTERS: { key: Props['filter']; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'unverified', label: 'Unverified' },
];

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}

function snipt(text: string, max = 80) {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export default function InboxView({
  messages,
  allCount,
  totalPages,
  currentPage,
  selectedMessageId,
  readMessageIds,
  searchQuery,
  filter,
  verusId,
  expandedSignatures,
  onSelectMessage,
  onBack,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onToggleSignature,
  formatRelativeTime,
}: Props) {
  const selectedMessage = messages.find(m => m.id === selectedMessageId) ?? null;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0 px-6 lg:px-10 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] uppercase tracking-[0.12em] transition-all font-sans border-white/[0.15] text-white/50 hover:bg-white hover:text-black hover:border-white"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
          <span className="text-caption text-white/70 font-sans truncate">Inbox · {verusId}</span>
          {allCount > 0 && (
            <span className="text-[10px] text-white/30 font-sans whitespace-nowrap">{allCount} message{allCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
          <input
            type="text"
            placeholder="Search messages…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-caption text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: list */}
        <div className="w-[40%] border-r border-white/[0.04] flex flex-col">
          {/* Filter tabs */}
          <div className="flex gap-1 p-3 border-b border-white/[0.04]">
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={`px-3 py-1.5 rounded-md text-[10px] uppercase tracking-[0.12em] transition-all font-sans ${
                    active
                      ? 'bg-white/[0.06] text-white border border-white/[0.06]'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {messages.length > 0 ? (
              <div className="divide-y divide-white/[0.03]">
                {messages.map(msg => {
                  const selected = msg.id === selectedMessageId;
                  const unread = !readMessageIds.has(msg.id);
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => onSelectMessage(msg.id)}
                      className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                        selected
                          ? 'bg-white/[0.04] border-l-white'
                          : 'border-l-transparent hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${unread ? 'bg-blue-400' : 'bg-transparent'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-caption font-sans truncate ${unread ? 'text-white/90 font-medium' : 'text-white/60'}`}>
                              {msg.subject}
                            </span>
                            {msg.verified && (
                              <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-white/30 font-sans truncate mt-0.5">
                            {snipt(msg.body)}
                          </p>
                          <span className="text-[9px] text-white/20 font-sans mt-1 block">
                            {formatRelativeTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-caption text-white/20 font-sans">
                  {searchQuery || filter !== 'all' ? 'No messages match your filter.' : 'No messages yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04] text-[10px] text-white/30 font-sans">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-default"
              >
                <ChevronLeft className="w-3 h-3" />
                Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-default"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right panel: detail */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedMessage ? (
            <div className="p-6 lg:p-10 max-w-2xl">
              {/* Back to list */}
              <button
                type="button"
                onClick={() => onSelectMessage(selectedMessage.id)}
                className="hidden lg:flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-white/30 hover:text-white/60 transition-colors mb-6 font-sans"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to list
              </button>

              {/* Verified badge */}
              <div className="flex items-center gap-2 mb-4">
                {selectedMessage.verified ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-green-400 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-sans">Unverified</span>
                )}
                <span className="text-[10px] text-white/20 font-sans">{selectedMessage.status}</span>
              </div>

              {/* Subject */}
              <h2 className="text-h3 font-heading text-white mb-4 leading-snug">{selectedMessage.subject}</h2>

              {/* Body */}
              <div className="text-caption text-white/60 font-sans leading-relaxed whitespace-pre-wrap mb-8">
                {selectedMessage.body}
              </div>

              {/* Metadata */}
              <div className="space-y-2 border-t border-white/[0.04] pt-4">
                {selectedMessage.signerIdentity && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-sans shrink-0">From</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] text-white/50 font-mono truncate">{selectedMessage.signerIdentity}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMessage.signerIdentity!)}
                        className="shrink-0 text-white/20 hover:text-white/60 transition-colors"
                        title="Copy identity"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {selectedMessage.channel && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-sans">Channel</span>
                    <span className="text-[11px] text-white/50 font-sans">{selectedMessage.channel}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-sans">Date</span>
                  <span className="text-[11px] text-white/50 font-sans">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Signature */}
              {selectedMessage.signature && (
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => onToggleSignature(selectedMessage.id)}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-white/25 hover:text-white/60 transition-colors font-sans mb-2"
                  >
                    {expandedSignatures.has(selectedMessage.id) ? 'Hide signature' : 'Show signature'}
                  </button>
                  {expandedSignatures.has(selectedMessage.id) && (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 text-[9px] text-white/20 font-mono break-all leading-relaxed select-all bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                        {selectedMessage.signature}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMessage.signature!)}
                        className="shrink-0 mt-2 text-white/20 hover:text-white/60 transition-colors"
                        title="Copy signature"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-caption text-white/20 font-sans">Select a message to read.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
