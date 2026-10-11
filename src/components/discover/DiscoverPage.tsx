import React, { useState, useEffect } from 'react';
import {
  Heart, X, SlidersHorizontal, MapPin, Sparkles, ShieldCheck,
  Search, UserCheck, MessageSquare, AlertTriangle, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Profile, NIGERIAN_STATES } from '../../types/index.ts';

interface DiscoverPageProps {
  onStartChatWithUser: (userId: string) => void;
  onOpenSubscriptions: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  onStartChatWithUser,
  onOpenSubscriptions
}) => {
  const { token, profile: myProfile, subscription, user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedIntention, setSelectedIntention] = useState<string>('All');
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [matchCelebration, setMatchCelebration] = useState<{ isOpen: boolean; matchUser?: Profile }>({
    isOpen: false
  });
  const [selectedProfileModal, setSelectedProfileModal] = useState<Profile | null>(null);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; targetUserId?: string }>({
    isOpen: false
  });
  const [reportReason, setReportReason] = useState('Inappropriate photos or bio');
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchProfiles = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedState !== 'All') params.append('state', selectedState);
    if (selectedGender !== 'All') params.append('gender', selectedGender);
    if (selectedIntention !== 'All') params.append('intention', selectedIntention);
    if (minAge) params.append('minAge', minAge.toString());
    if (maxAge) params.append('maxAge', maxAge.toString());
    if (searchQuery.trim()) params.append('search', searchQuery.trim());

    try {
      const res = await fetch(`/api/discover?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch matches');

      setProfiles(data.profiles || []);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [token, selectedState, selectedGender, selectedIntention, minAge, maxAge]);

  const handleLike = async (targetProfile: Profile) => {
    try {
      const res = await fetch('/api/discover/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId: targetProfile.userId })
      });
      const data = await res.json();

      if (data.isMatch) {
        setMatchCelebration({ isOpen: true, matchUser: targetProfile });
      }

      // Advance index
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/messages/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: targetUserId })
      });
      if (res.ok) {
        alert('Connection request dispatched!');
      } else {
        const d = await res.json();
        alert(d.error || 'Could not send request');
      }
    } catch (e) {
      alert('Error sending request');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal.targetUserId) return;

    try {
      await fetch('/api/messages/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: 'profile',
          targetId: reportModal.targetUserId,
          reason: reportReason
        })
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportModal({ isOpen: false });
        setReportSuccess(false);
      }, 1500);
    } catch (err) {
      alert('Failed to submit report');
    }
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Discover Singles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified members seeking genuine relationships across Nigeria
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProfiles()}
              placeholder="Search by state, city, interests..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-xs focus:border-[#008751] outline-hidden bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#008751]" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilterDrawer && (
        <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white outline-hidden"
            >
              <option value="All">All States (Nigeria)</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white outline-hidden"
            >
              <option value="All">All Genders</option>
              <option value="Woman">Women</option>
              <option value="Man">Men</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Intention
            </label>
            <select
              value={selectedIntention}
              onChange={(e) => setSelectedIntention(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white outline-hidden"
            >
              <option value="All">Any Intention</option>
              <option value="Serious Relationship">Serious Relationship</option>
              <option value="Casual Dating">Casual Dating</option>
              <option value="Friendship">Friendship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Age Range: {minAge} – {maxAge}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="18"
                max={maxAge}
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-20 h-10 px-2 rounded-xl border border-slate-300 text-xs text-center outline-hidden"
              />
              <span className="text-slate-400">to</span>
              <input
                type="number"
                min={minAge}
                max="80"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-20 h-10 px-2 rounded-xl border border-slate-300 text-xs text-center outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Discover Content */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-[#008751] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm">Finding compatible singles in Nigeria...</p>
        </div>
      ) : profiles.length === 0 || currentIndex >= profiles.length ? (
        <div className="max-w-md mx-auto text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#008751] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">You’ve caught up with all matches!</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Expand your location or age filters to meet more singles across Nigeria, or check back later as new members register.
          </p>
          <button
            onClick={() => {
              setSelectedState('All');
              setSelectedGender('All');
              setSelectedIntention('All');
              setMinAge(18);
              setMaxAge(70);
              fetchProfiles();
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Spotlight Card & Profile Details */
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-200">
            {/* Primary Photo */}
            <div className="relative aspect-4/5 sm:aspect-1/1 bg-slate-900 overflow-hidden">
              <img
                src={currentProfile.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                alt={currentProfile.displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {currentProfile.displayName}, {currentProfile.age}
                  </h2>
                  {currentProfile.isIdentityVerified && (
                    <span className="flex items-center gap-1 bg-[#008751] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  {currentProfile.onlineStatus && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Online
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-200 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {currentProfile.city}, {currentProfile.state}
                  </span>
                  <span>·</span>
                  <span>{currentProfile.relationshipIntention}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                  {currentProfile.bio}
                </p>

                {/* Interests Chips */}
                {currentProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentProfile.interests.slice(0, 5).map((interest) => (
                      <span
                        key={interest}
                        className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-[11px] font-medium text-white"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 sm:p-6 bg-white flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setSelectedProfileModal(currentProfile)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100"
              >
                <Eye className="w-4 h-4 text-slate-400" />
                <span>Full Profile</span>
              </button>

              <div className="flex items-center gap-3">
                {/* Pass Button */}
                <button
                  onClick={handlePass}
                  className="w-13 h-13 rounded-full border-2 border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Pass"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(currentProfile)}
                  className="w-14 h-14 rounded-full bg-[#008751] text-white hover:bg-[#007043] flex items-center justify-center transition-all shadow-lg shadow-[#008751]/25 active:scale-95"
                  title="Like"
                >
                  <Heart className="w-7 h-7 fill-white" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendFriendRequest(currentProfile.userId)}
                  className="p-2.5 text-slate-500 hover:text-[#008751] hover:bg-emerald-50 rounded-xl transition-colors"
                  title="Send Connection Request"
                >
                  <UserCheck className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setReportModal({ isOpen: true, targetUserId: currentProfile.userId })}
                  className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                  title="Report Profile"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL PROFILE MODAL */}
      {selectedProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProfileModal(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black text-slate-900">
                {selectedProfileModal.displayName}, {selectedProfileModal.age}
              </h2>
              {selectedProfileModal.isIdentityVerified && (
                <span className="flex items-center gap-1 bg-[#008751] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {selectedProfileModal.city}, {selectedProfileModal.state} · Seeking {selectedProfileModal.relationshipIntention}
            </p>

            {/* Gallery */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {selectedProfileModal.photos.map((photo, i) => (
                <img
                  key={photo.id || i}
                  src={photo.url}
                  alt={`Photo of ${selectedProfileModal.displayName}`}
                  className="w-full aspect-square object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  About
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedProfileModal.bio}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Interests
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfileModal.interests.map((it) => (
                    <span key={it} className="px-3 py-1 rounded-lg bg-slate-100 text-xs text-slate-800">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setSelectedProfileModal(null);
                  handleLike(selectedProfileModal);
                }}
                className="flex-1 py-3 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase hover:bg-[#007043] flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                Like Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MUTUAL MATCH CELEBRATION MODAL */}
      {matchCelebration.isOpen && matchCelebration.matchUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#008751]/10 text-[#008751] flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Heart className="w-8 h-8 fill-[#008751]" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              It’s a Match! 🎉
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              You and <strong>{matchCelebration.matchUser.displayName}</strong> liked each other!
            </p>

            <div className="flex justify-center -space-x-4 my-6">
              <img
                src={myProfile?.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                alt="You"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
              <img
                src={matchCelebration.matchUser.photos[0]?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'}
                alt={matchCelebration.matchUser.displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const targetId = matchCelebration.matchUser!.userId;
                  setMatchCelebration({ isOpen: false });
                  onStartChatWithUser(targetId);
                }}
                className="w-full py-3 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] flex items-center justify-center gap-2 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                Send a Message
              </button>

              <button
                onClick={() => setMatchCelebration({ isOpen: false })}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setReportModal({ isOpen: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Report Profile
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Help keep NaijaMatch safe for everyone. All reports are investigated.
            </p>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl">
                Thank you. Your report has been submitted for administrative review.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs outline-hidden bg-white"
                  >
                    <option value="Inappropriate photos or bio">Inappropriate photos or bio</option>
                    <option value="Suspected scam or financial solicitation">Suspected scam or financial solicitation</option>
                    <option value="Harassment or abusive language">Harassment or abusive language</option>
                    <option value="Fake profile or impersonation">Fake profile or impersonation</option>
                    <option value="Underage member (Under 18)">Underage member (Under 18)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
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
