import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Shield, Lock, UserX, AlertTriangle, UserCheck, MessageSquare,
  Clock, CheckCheck, MapPin, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Conversation, Message, Profile, FriendRequest } from '../../types/index.ts';

interface MessagesPageProps {
  initialConversationId?: string;
  onOpenSubscriptions: () => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  initialConversationId,
  onOpenSubscriptions
}) => {
  const { token, user, profile: myProfile, subscription, ws, onlineUsers } = useAuth();

  const [conversations, setConversations] = useState<Array<Conversation & { otherParticipant: Profile; unreadCount: number }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: []
  });

  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch Conversations
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (!activeConversationId && data.conversations && data.conversations.length > 0) {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setIsLoadingConvos(false);
    }
  };

  // Fetch Friend Requests
  const fetchFriendRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages/friends/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data);
      }
    } catch (e) {
      console.error('Error fetching friend requests:', e);
    }
  };

  // Fetch Messages for active conversation
  const fetchMessages = async (convoId: string) => {
    if (!token) return;
    setIsLoadingMessages(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/messages/conversations/${convoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        const d = await res.json();
        setErrorNotice(d.error || 'Failed to load conversation');
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchFriendRequests();
  }, [token]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      // Join conversation channel via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'join_conversation', conversationId: activeConversationId }));
      }
    }
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN && activeConversationId) {
        ws.send(JSON.stringify({ type: 'leave_conversation' }));
      }
    };
  }, [activeConversationId, ws]);

  // WebSocket message listener
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'new_message' && data.message) {
          const msg = data.message as Message;
          if (msg.conversationId === activeConversationId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
          fetchConversations();
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId) return;

    // Client-side quick check (Backend strictly enforces access)
    if (!subscription && user?.role !== 'admin') {
      setErrorNotice('Sending messages requires an active NaijaMatch membership subscription.');
      return;
    }

    const content = messageInput.trim();
    setMessageInput('');

    try {
      const res = await fetch(`/api/messages/conversations/${activeConversationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorNotice(data.error || 'Failed to send message');
        if (data.requiresSubscription) {
          onOpenSubscriptions();
        }
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      fetchConversations();
    } catch (err: any) {
      setErrorNotice('Connection error while sending message');
    }
  };

  const handleBlockUser = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to block this user? They will not be able to message you or view your profile.')) return;
    try {
      await fetch('/api/messages/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });
      alert('User has been blocked.');
      fetchConversations();
      setActiveConversationId(null);
    } catch (e) {
      alert('Failed to block user');
    }
  };

  const handleFriendAction = async (requestId: string, action: 'accept' | 'decline' | 'cancel') => {
    try {
      const res = await fetch('/api/messages/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, action })
      });
      if (res.ok) {
        fetchFriendRequests();
        fetchConversations();
      }
    } catch (e) {
      alert('Failed to respond to connection request');
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isTargetOnline = activeConversation?.otherParticipant
    ? onlineUsers.has(activeConversation.otherParticipant.userId) || activeConversation.otherParticipant.onlineStatus
    : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
      {/* Messages Header / Tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Messages & Connections
          </h1>
          <p className="text-xs text-slate-500">
            Real-time encrypted communication with verified singles
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'chats'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chats ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requests ({friendRequests.incoming.length})
          </button>
        </div>
      </div>

      {activeTab === 'chats' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs mt-4">
          {/* Conversation List (Sidebar) */}
          <div
            className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col h-full ${
              activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Recent Conversations
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {isLoadingConvos ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No active conversations yet</p>
                  <p className="text-slate-400">
                    Go to Discover or Likes to start matching and chatting!
                  </p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isOnline = onlineUsers.has(c.otherParticipant.userId) || c.otherParticipant.onlineStatus;
                  const isSelected = c.id === activeConversationId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={c.otherParticipant.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                          alt={c.otherParticipant.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {c.otherParticipant.displayName}
                          </h4>
                          {c.lastMessage && (
                            <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                              {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {c.lastMessage ? c.lastMessage.content : 'Started a conversation'}
                        </p>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#008751] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Pane */}
          <div
            className={`md:col-span-8 lg:col-span-8 flex flex-col h-full bg-[#F5F7F6]/40 ${
              !activeConversationId ? 'hidden md:flex items-center justify-center' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Header */}
                <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="md:hidden p-1.5 text-slate-500 hover:text-slate-800"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <img
                        src={activeConversation.otherParticipant.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                        alt={activeConversation.otherParticipant.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isTargetOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {activeConversation.otherParticipant.displayName}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>{activeConversation.otherParticipant.city}, {activeConversation.otherParticipant.state}</span>
                        <span>·</span>
                        <span className={isTargetOnline ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                          {isTargetOnline ? 'Online' : 'Offline'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBlockUser(activeConversation.otherParticipant.userId)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Block User"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subscription Warning Alert if free user */}
                {!subscription && user?.role !== 'admin' && (
                  <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>An active subscription is required to send and receive messages.</span>
                    </div>
                    <button
                      onClick={onOpenSubscriptions}
                      className="px-3 py-1 rounded-lg bg-[#008751] text-white text-[11px] font-bold hover:bg-[#007043]"
                    >
                      Upgrade
                    </button>
                  </div>
                )}

                {errorNotice && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs text-center border-b border-red-200">
                    {errorNotice}
                  </div>
                )}

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                  {isLoadingMessages ? (
                    <div className="text-center py-10 text-xs text-slate-400">Loading conversation...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs space-y-1">
                      <p className="font-semibold text-slate-700">Say Hello! 👋</p>
                      <p>Start your journey by sending a respectful, thoughtful first message.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#008751] text-white rounded-br-xs shadow-xs'
                                : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums flex items-center gap-1">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {isMe && <CheckCheck className="w-3 h-3 text-[#008751]" />}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      subscription || user?.role === 'admin'
                        ? 'Type a message...'
                        : 'Upgrade to send messages...'
                    }
                    disabled={!subscription && user?.role !== 'admin'}
                    className="flex-1 h-11 px-4 rounded-xl border border-slate-300 text-xs focus:border-[#008751] outline-hidden disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={(!subscription && user?.role !== 'admin') || !messageInput.trim()}
                    className="h-11 px-5 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center p-8 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Select a conversation</p>
                <p className="text-xs text-slate-400 mt-1">Choose a chat from the left to start messaging</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CONNECTION REQUESTS TAB */
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Incoming Connection Requests
          </h3>

          {friendRequests.incoming.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No pending connection requests at the moment.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {friendRequests.incoming.map((req) => (
                <div key={req.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Connection Request</p>
                    <p className="text-[11px] text-slate-400">
                      Sent on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFriendAction(req.id, 'accept')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#008751] text-white text-xs font-semibold hover:bg-[#007043]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleFriendAction(req.id, 'decline')}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
