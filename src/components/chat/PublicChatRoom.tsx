import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Reply, X, ShieldCheck, Trash2, AlertTriangle, Users,
  MessageSquare, Wifi, WifiOff, Clock, MapPin, Sparkles, LogIn,
  Volume2, VolumeX, Smile, ArrowDown, UserPlus, Check, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PublicChatMessage, NigerianState, NIGERIAN_STATES } from '../../types/index.ts';

interface PublicChatRoomProps {
  onOpenAuth: () => void;
}

// Web Audio synthesizer chime for incoming messages
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio context may require prior user interaction
  }
};

const COMMON_REACTION_EMOJIS = ['❤️', '🔥', '😂', '🇳🇬', '👏'];
const QUICK_INSERT_EMOJIS = ['🇳🇬', '❤️', '🔥', '😂', '👏', '🙏', '🎉', '💃', '🕺', '👋'];

export const PublicChatRoom: React.FC<PublicChatRoomProps> = ({ onOpenAuth }) => {
  const { user, profile, token, ws } = useAuth();

  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<PublicChatMessage | null>(null);

  // Guest State
  const [guestName, setGuestName] = useState<string>(() => localStorage.getItem('naijamatch_guest_name') || '');
  const [guestState, setGuestState] = useState<string>(() => localStorage.getItem('naijamatch_guest_state') || 'Lagos');
  const [guestId, setGuestId] = useState<string>(() => {
    let id = localStorage.getItem('naijamatch_guest_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('naijamatch_guest_id', id);
    }
    return id;
  });
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [tempJoinName, setTempJoinName] = useState('');
  const [tempJoinState, setTempJoinState] = useState('Lagos');

  // Chat State
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => localStorage.getItem('naijamatch_sound') !== 'false');
  const [showActiveDrawer, setShowActiveDrawer] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Report Modal
  const [reportModalMsg, setReportModalMsg] = useState<PublicChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate language or harassment');
  const [reportSent, setReportSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Active user's effective identity
  const currentActorId = user?.id || guestId;
  const currentActorName = user ? (profile?.displayName || user.email.split('@')[0]) : guestName;

  // Fetch messages from database
  const fetchMessages = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await fetch('/api/public-chat/messages?limit=100');
      if (!res.ok) throw new Error('Failed to load chat messages');
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => {
          if (silent) {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = (data.messages as PublicChatMessage[]).filter((m) => !existingIds.has(m.id));
            if (newOnes.length > 0) {
              if (soundEnabled) playNotificationChime();
              return [...prev, ...newOnes];
            }
            return prev;
          }
          return data.messages;
        });
      }
      if (typeof data.onlineCount === 'number') {
        setOnlineCount(Math.max(1, data.onlineCount));
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Could not load messages');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Fetch active users in room
  const fetchActiveUsers = async () => {
    try {
      const res = await fetch('/api/public-chat/active-users');
      if (res.ok) {
        const data = await res.json();
        setActiveUsersList(data.activeUsers || []);
      }
    } catch (e) {
      // quiet fail
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchActiveUsers();
  }, []);

  // Real-time synchronization hub (WebSocket + fallback polling)
  useEffect(() => {
    let activeSocket: WebSocket | null = ws;
    let localSocketCreated = false;

    if (!activeSocket) {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        activeSocket = new WebSocket(wsUrl);
        localSocketCreated = true;
      } catch (err) {
        console.error('Spectator WebSocket init failed:', err);
      }
    }

    if (!activeSocket) {
      setWsStatus('disconnected');
      return;
    }

    if (activeSocket.readyState === WebSocket.OPEN) {
      setWsStatus('connected');
    } else {
      setWsStatus('connecting');
    }

    const handleOpen = () => setWsStatus('connected');
    const handleClose = () => setWsStatus('disconnected');

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'public_chat_message' && data.message) {
          const newMsg = data.message as PublicChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            if (soundEnabled && newMsg.senderId !== currentActorId) {
              playNotificationChime();
            }
            return [...prev, newMsg];
          });
        } else if (data.type === 'public_chat_reaction' && data.messageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId ? { ...m, reactions: data.reactions } : m
            )
          );
        } else if (data.type === 'public_chat_delete' && data.messageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId
                ? { ...m, isDeleted: true, content: '[This message was removed by moderator]' }
                : m
            )
          );
        } else if (data.type === 'presence_update' && typeof data.onlineCount === 'number') {
          setOnlineCount(Math.max(1, data.onlineCount));
        }
      } catch (err) {
        console.error('Error handling public chat socket event:', err);
      }
    };

    activeSocket.addEventListener('open', handleOpen);
    activeSocket.addEventListener('close', handleClose);
    activeSocket.addEventListener('message', handleMessage);

    // Fallback sync polling if WS drops
    const pollTimer = setInterval(() => {
      if (wsStatus !== 'connected') {
        fetchMessages(true);
      }
    }, 3500);

    return () => {
      clearInterval(pollTimer);
      if (activeSocket) {
        activeSocket.removeEventListener('open', handleOpen);
        activeSocket.removeEventListener('close', handleClose);
        activeSocket.removeEventListener('message', handleMessage);
        if (localSocketCreated && (activeSocket.readyState === WebSocket.OPEN || activeSocket.readyState === WebSocket.CONNECTING)) {
          activeSocket.close();
        }
      }
    };
  }, [ws, wsStatus, soundEnabled, currentActorId]);

  // Auto-scroll on new message arrival
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Toggle audio notification setting
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('naijamatch_sound', String(nextVal));
    if (nextVal) playNotificationChime();
  };

  // Join as guest handler
  const handleSaveGuestProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempJoinName.trim()) return;

    const trimmed = tempJoinName.trim().slice(0, 30);
    setGuestName(trimmed);
    setGuestState(tempJoinState);
    localStorage.setItem('naijamatch_guest_name', trimmed);
    localStorage.setItem('naijamatch_guest_state', tempJoinState);
    setIsJoinModalOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Send Public Message (Handles both registered users and guest members)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    // If not authenticated and no guest name chosen yet, prompt them to pick a name
    if (!user && !guestName) {
      setTempJoinName('');
      setTempJoinState('Lagos');
      setIsJoinModalOpen(true);
      return;
    }

    const contentToSend = inputContent.trim();
    const replyTargetId = replyingTo?.id;

    setIsSending(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const bodyPayload: any = {
        content: contentToSend,
        replyToMessageId: replyTargetId
      };

      if (!user) {
        bodyPayload.guestName = guestName;
        bodyPayload.guestState = guestState;
        bodyPayload.guestId = guestId;
      }

      const res = await fetch('/api/public-chat/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      // Optimistic update
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }

      setInputContent('');
      setReplyingTo(null);
    } catch (err: any) {
      setError(err.message || 'Could not send message.');
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // React to message with emoji
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Optimistic reaction update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions ? [...m.reactions] : [];
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            const hasUser = existing.users.includes(currentActorId);
            if (hasUser) {
              existing.users = existing.users.filter((u) => u !== currentActorId);
              existing.count = Math.max(0, existing.count - 1);
            } else {
              existing.users.push(currentActorId);
              existing.count++;
            }
          } else {
            reactions.push({ emoji, count: 1, users: [currentActorId] });
          }
          return { ...m, reactions: reactions.filter((r) => r.count > 0) };
        })
      );

      const res = await fetch(`/api/public-chat/messages/${messageId}/react`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ emoji, actorId: currentActorId })
      });
      if (!res.ok) {
        fetchMessages(true);
      }
    } catch (e) {
      console.error('Error toggling reaction:', e);
    }
  };

  // Scroll and highlight original message
  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(messageId);
      setTimeout(() => setHighlightedMsgId(null), 2500);
    }
  };

  // Delete message (Author or Admin)
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/public-chat/messages/${messageId}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ actorId: currentActorId })
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: '[This message was removed by moderator]' }
              : m
          )
        );
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete message');
      }
    } catch (e) {
      alert('Network error while deleting message');
    }
  };

  // Submit report on abusive message
  const handleReportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalMsg) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/public-chat/messages/${reportModalMsg.id}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: reportReason, reporterId: currentActorId })
      });
      setReportSent(true);
      setTimeout(() => {
        setReportModalMsg(null);
        setReportSent(false);
      }, 1500);
    } catch (e) {
      alert('Could not submit report');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 h-[calc(100vh-7.5rem)] min-h-[580px] flex flex-col relative">
      {/* ROOM HEADER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 px-4 sm:px-6 py-3.5 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#008751] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            🇳🇬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Naija Public Chatroom
              </h1>
              <span className="text-[10px] font-black text-[#008751] bg-[#008751]/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008751] animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Open Nigerian room: chat, reply, react, and connect in real-time
            </p>
          </div>
        </div>

        {/* Controls: Online Counter, Audio Toggle, Active Members, Connection Status */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold ml-auto">
          {/* Active Members Button */}
          <button
            onClick={() => {
              setShowActiveDrawer(!showActiveDrawer);
              fetchActiveUsers();
            }}
            className="flex items-center gap-1.5 text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
            title="View active room participants"
          >
            <Users className="w-3.5 h-3.5 text-[#008751]" />
            <span className="tabular-nums font-bold text-slate-900">{onlineCount}</span>
            <span className="hidden sm:inline text-slate-500">online</span>
          </button>

          {/* Sound Notification Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-emerald-50 text-[#008751] border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* WebSocket Live Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            {wsStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            ) : wsStatus === 'connecting' ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <WifiOff className="w-3 h-3 text-slate-400" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE PARTICIPANTS DRAWER */}
      {showActiveDrawer && (
        <div className="mb-3 bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#008751]" />
              <span className="text-xs font-bold text-slate-900">
                Recent Room Members ({activeUsersList.length || onlineCount})
              </span>
            </div>
            <button
              onClick={() => setShowActiveDrawer(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {activeUsersList.length > 0 ? (
              activeUsersList.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs shrink-0"
                >
                  {u.photo ? (
                    <img src={u.photo} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#008751]/10 text-[#008751] font-bold text-[10px] flex items-center justify-center">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-slate-800 text-xs truncate max-w-[100px]">
                    {u.name}
                  </span>
                  {u.isVerified && <ShieldCheck className="w-3 h-3 text-[#008751]" />}
                  {u.state && <span className="text-[10px] text-slate-400">({u.state})</span>}
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 py-1">
                You and other Nigerian singles are connected in the public room right now.
              </span>
            )}
          </div>
        </div>
      )}

      {/* MAIN CHAT FEED CONTAINER */}
      <div
        ref={chatContainerRef}
        className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-y-auto p-4 sm:p-6 shadow-xs flex flex-col space-y-4"
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
            <div className="w-9 h-9 border-3 border-[#008751] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading Nigerian chat room...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#008751] flex items-center justify-center mx-auto shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Welcome to the Public Room! 🇳🇬
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No messages posted yet today. Be the first to greet fellow Nigerian singles and spark a discussion!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentActorId === msg.senderId || (user && user.id === msg.senderId);
            const canDelete = isMe || user?.role === 'admin';
            const isHighlighted = highlightedMsgId === msg.id;

            return (
              <div
                id={`msg-${msg.id}`}
                key={msg.id}
                className={`flex items-start gap-3 group transition-all duration-300 p-2.5 sm:p-3 rounded-2xl ${
                  isHighlighted
                    ? 'ring-2 ring-[#008751] bg-emerald-50/80 scale-[1.01]'
                    : isMe
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Sender Avatar */}
                <div className="shrink-0 pt-0.5">
                  {msg.senderPhoto ? (
                    <img
                      src={msg.senderPhoto}
                      alt={msg.senderName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#008751]/10 text-[#008751] font-black text-sm flex items-center justify-center border border-[#008751]/20">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {msg.senderName}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded-sm">
                        You
                      </span>
                    )}
                    {msg.isVerified && (
                      <span className="flex items-center text-[10px] text-[#008751] font-semibold" title="Verified Nigerian Single">
                        <ShieldCheck className="w-3.5 h-3.5 fill-[#008751] text-white" />
                      </span>
                    )}
                    {msg.senderState && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        {msg.senderState}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Reply-to Quote Preview (Interactive Jump) */}
                  {msg.replyTo && (
                    <button
                      type="button"
                      onClick={() => handleJumpToMessage(msg.replyTo!.id)}
                      className="mb-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border-l-3 border-[#008751] text-left transition-colors max-w-lg block group/quote"
                      title="Click to view original message"
                    >
                      <span className="font-bold text-[11px] text-[#008751] flex items-center gap-1">
                        <Reply className="w-3 h-3" />
                        Replying to {msg.replyTo.senderName}:
                      </span>
                      <p className="line-clamp-2 italic text-[11px] text-slate-600 mt-0.5 group-hover/quote:text-slate-900">
                        "{msg.replyTo.content}"
                      </p>
                    </button>
                  )}

                  {/* Message Content */}
                  <div
                    className={`text-xs sm:text-sm leading-relaxed break-words ${
                      msg.isDeleted ? 'text-slate-400 italic' : 'text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Emoji Reactions Bar */}
                  {!msg.isDeleted && (
                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      {msg.reactions && msg.reactions.map((r) => {
                        const hasReacted = r.users.includes(currentActorId);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => handleReactToMessage(msg.id, r.emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                              hasReacted
                                ? 'bg-emerald-50 text-[#008751] border-emerald-300 font-bold'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="tabular-nums font-semibold text-[10px]">{r.count}</span>
                          </button>
                        );
                      })}

                      {/* Quick Reactions Palette */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {COMMON_REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactToMessage(msg.id, emoji)}
                            className="text-xs p-1 hover:scale-125 transition-transform"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Actions (Reply, Report, Delete) */}
                {!msg.isDeleted && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => {
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                      className="p-1.5 text-slate-500 hover:text-[#008751] rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs"
                      title="Reply to message"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-semibold">Reply</span>
                    </button>

                    {!isMe && (
                      <button
                        onClick={() => setReportModalMsg(msg)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Report message"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* REPLYING-TO PREVIEW BAR */}
      {replyingTo && (
        <div className="mt-2 bg-emerald-50 border border-[#008751]/30 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply className="w-4 h-4 text-[#008751] shrink-0" />
            <span className="font-bold text-[#008751] shrink-0">
              Replying to {replyingTo.senderName}:
            </span>
            <span className="truncate italic text-slate-600">
              "{replyingTo.content}"
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            title="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK EMOJI PALETTE (Mobile & Desktop) */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto py-1 px-1 shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Quick:
        </span>
        {QUICK_INSERT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setInputContent((prev) => prev + emoji)}
            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-sm hover:border-[#008751] hover:scale-110 active:scale-95 transition-all shrink-0"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* ERROR FEEDBACK ALERT */}
      {error && (
        <div className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 text-center shrink-0">
          {error}
        </div>
      )}

      {/* MESSAGE INPUT & PARTICIPATION BAR */}
      <div className="mt-2 shrink-0">
        {/* If Guest Has Not Set Name, Provide Clean Inline Join Bar */}
        {!user && !guestName ? (
          <div className="bg-white rounded-3xl border border-slate-300 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Everyone is welcome to chat and reply! 🇳🇬
              </h4>
              <p className="text-xs text-slate-500">
                Choose a chat name to join instantly, or sign in with your NaijaMatch account.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join with Name (Instant)</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Live Chat Input Form */
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-white rounded-2xl border border-slate-300 p-1.5 shadow-xs focus-within:border-[#008751] focus-within:ring-2 focus-within:ring-[#008751]/20 transition-all"
          >
            {/* Identity Pill on Input Left */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#008751]" />
              <span className="truncate max-w-[90px]">{currentActorName}</span>
              {!user && (
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="text-[10px] text-slate-400 hover:text-[#008751] underline ml-1"
                >
                  edit
                </button>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                replyingTo
                  ? `Replying to ${replyingTo.senderName}...`
                  : `Type your message here, ${currentActorName || 'Naija single'}... (Enter to send)`
              }
              maxLength={1000}
              className="flex-1 h-11 px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-hidden bg-transparent"
            />

            <button
              type="submit"
              disabled={isSending || !inputContent.trim()}
              className="h-11 px-5 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] active:scale-95 transition-all shadow-xs disabled:opacity-40 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
      </div>

      {/* QUICK JOIN MODAL (Choose Name & State to Chat Immediately) */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008751] flex items-center justify-center mx-auto mb-2 text-xl font-black">
                🇳🇬
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Join the Naija Room
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pick a display name to start chatting and replying immediately!
              </p>
            </div>

            <form onSubmit={handleSaveGuestProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Chat Display Name
                </label>
                <input
                  type="text"
                  value={tempJoinName}
                  onChange={(e) => setTempJoinName(e.target.value)}
                  required
                  maxLength={30}
                  placeholder="e.g. Tunde, Chidinma, LagosGuy"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Nigerian State
                </label>
                <select
                  value={tempJoinState}
                  onChange={(e) => setTempJoinState(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!tempJoinName.trim()}
                className="w-full py-3 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-xs disabled:opacity-40"
              >
                Join & Start Chatting 🚀
              </button>

              <div className="text-center pt-1 border-t border-slate-100">
                <span className="text-xs text-slate-500">Want full verified dating profile? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    onOpenAuth();
                  }}
                  className="text-xs font-bold text-[#008751] hover:underline"
                >
                  Sign In / Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MESSAGE MODAL */}
      {reportModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setReportModalMsg(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Report Public Message
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Help keep our Nigerian dating community respectful and safe.
            </p>

            {reportSent ? (
              <div className="p-4 bg-emerald-50 text-[#008751] text-xs font-semibold rounded-xl text-center">
                Report submitted for administrative moderation review.
              </div>
            ) : (
              <form onSubmit={handleReportMessage} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs outline-hidden bg-white"
                  >
                    <option value="Inappropriate language or harassment">Inappropriate language or harassment</option>
                    <option value="Suspected fraud or financial scam">Suspected fraud or financial scam</option>
                    <option value="Spam or unsolicited advertising">Spam or unsolicited advertising</option>
                    <option value="Hate speech or abusive content">Hate speech or abusive content</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                >
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
