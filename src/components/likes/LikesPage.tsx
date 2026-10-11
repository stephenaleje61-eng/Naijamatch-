import React, { useState, useEffect } from 'react';
import { Heart, Lock, Sparkles, MessageSquare, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Profile, Match } from '../../types/index.ts';

interface LikesPageProps {
  onStartChat: (userId: string) => void;
  onOpenSubscriptions: () => void;
}

export const LikesPage: React.FC<LikesPageProps> = ({
  onStartChat,
  onOpenSubscriptions
}) => {
  const { token, subscription, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'received' | 'matches'>('received');

  const [likesData, setLikesData] = useState<{
    hasAccess: boolean;
    count: number;
    profiles: Profile[];
  }>({
    hasAccess: false,
    count: 0,
    profiles: []
  });

  const [matches, setMatches] = useState<Array<{ match: Match; otherProfile: Profile }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const [likesRes, matchesRes] = await Promise.all([
        fetch('/api/discover/likes-received', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/discover/matches', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (likesRes.ok) {
        const lData = await likesRes.json();
        setLikesData(lData);
      }

      if (matchesRes.ok) {
        const mData = await matchesRes.json();
        setMatches(mData.matches || []);
      }
    } catch (e) {
      console.error('Error fetching likes & matches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Likes & Matches
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep track of who likes your profile and mutual connections
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Likes Received ({likesData.count})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'matches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mutual Matches ({matches.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'received' ? (
        <div>
          {/* Subscribed Access */}
          {likesData.hasAccess ? (
            likesData.profiles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Likes Yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Keep your profile active and updated with clear photos to attract singles!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {likesData.profiles.map((p) => (
                  <div
                    key={p.userId}
                    className="group rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-100">
                      <img
                        src={p.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                        alt={p.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                        <h4 className="text-sm font-bold truncate">
                          {p.displayName}, {p.age}
                        </h4>
                        <p className="text-[11px] text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{p.city}, {p.state}</span>
                        </p>
                      </div>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={() => onStartChat(p.userId)}
                        className="w-full py-2 rounded-xl bg-[#008751] text-white text-xs font-semibold hover:bg-[#007043] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Free / Locked Preview */
            <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-8 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {likesData.count} {likesData.count === 1 ? 'person likes' : 'people like'} your profile!
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Upgrade your account to immediately unlock and chat with every single member who has liked you.
                </p>

                {/* Blurred avatars teaser */}
                <div className="flex justify-center -space-x-4 my-6 py-2">
                  {[1, 2, 3, 4].slice(0, Math.max(1, likesData.count)).map((i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-full border-2 border-white shadow-md bg-slate-300 filter blur-xs overflow-hidden"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-700" />
                    </div>
                  ))}
                </div>

                <button
                  onClick={onOpenSubscriptions}
                  className="w-full py-3.5 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] shadow-md transition-all"
                >
                  Unlock Who Liked Me Now
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MUTUAL MATCHES TAB */
        <div>
          {matches.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Mutual Matches Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Mutual matches happen when two people like each other. Go to Discover and start liking singles to spark connections!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {matches.map(({ match, otherProfile }) => (
                <div
                  key={match.id}
                  className="group rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    <img
                      src={otherProfile.photos[0]?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'}
                      alt={otherProfile.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                      <h4 className="text-sm font-bold truncate">
                        {otherProfile.displayName}, {otherProfile.age}
                      </h4>
                      <p className="text-[11px] text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{otherProfile.city}, {otherProfile.state}</span>
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    <button
                      onClick={() => onStartChat(otherProfile.userId)}
                      className="w-full py-2 rounded-xl bg-[#008751] text-white text-xs font-semibold hover:bg-[#007043] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Conversation</span>
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
