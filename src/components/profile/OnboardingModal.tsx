import React, { useState } from 'react';
import { X, Upload, Trash2, ArrowUp, ArrowDown, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NIGERIAN_STATES, NigerianState, RelationshipIntention, Gender, DatingPreference, ProfilePhoto } from '../../types/index.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_INTERESTS = [
  'Afrobeats', 'Cooking', 'Travel', 'Fitness', 'Tech & Startups',
  'Real Estate', 'Photography', 'Reading', 'Tennis', 'Nollywood',
  'Fashion & Style', 'Dining Out', 'Faith & Church', 'Entrepreneurship',
  'Music Production', 'Podcasts', 'Hiking', 'Art & Design'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile, token, updateProfileState } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '1998-05-15');
  const [gender, setGender] = useState<Gender>(profile?.gender || 'Woman');
  const [datingPreference, setDatingPreference] = useState<DatingPreference>(profile?.datingPreference || 'Men');
  const [relationshipIntention, setRelationshipIntention] = useState<RelationshipIntention>(
    profile?.relationshipIntention || 'Serious Relationship'
  );
  const [state, setState] = useState<NigerianState>(profile?.state || 'Lagos');
  const [city, setCity] = useState(profile?.city || 'Lekki');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState<string[]>(profile?.interests || ['Afrobeats', 'Travel', 'Cooking']);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [showOnlineStatus, setShowOnlineStatus] = useState(profile?.showOnlineStatus !== false);
  const [showLocation, setShowLocation] = useState(profile?.showLocation !== false);

  // Photos: Support 1-5 photos with upload and reordering
  const [photos, setPhotos] = useState<ProfilePhoto[]>(
    profile?.photos && profile.photos.length > 0
      ? profile.photos
      : [
          {
            id: 'p_default_1',
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            isPrimary: true,
            order: 0
          }
        ]
  );

  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    if (photos.length >= 6) {
      setError('You can add a maximum of 6 profile photos.');
      return;
    }
    const newPhoto: ProfilePhoto = {
      id: `photo_${Date.now()}`,
      url: photoUrlInput.trim(),
      isPrimary: photos.length === 0,
      order: photos.length
    };
    setPhotos([...photos, newPhoto]);
    setPhotoUrlInput('');
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are permitted.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newPhoto: ProfilePhoto = {
        id: `photo_${Date.now()}`,
        url: base64,
        isPrimary: photos.length === 0,
        order: photos.length
      };
      setPhotos([...photos, newPhoto]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (id: string) => {
    if (photos.length <= 1) {
      setError('You must keep at least 1 profile photo.');
      return;
    }
    const filtered = photos.filter(p => p.id !== id);
    // Re-index order
    const reindexed = filtered.map((p, idx) => ({ ...p, order: idx, isPrimary: idx === 0 }));
    setPhotos(reindexed);
  };

  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const copy = [...photos];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reindexed = copy.map((p, idx) => ({ ...p, order: idx, isPrimary: idx === 0 }));
    setPhotos(reindexed);
  };

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter(i => i !== item));
    } else {
      if (interests.length >= 8) {
        setError('You can select up to 8 interests.');
        return;
      }
      setInterests([...interests, item]);
      setError(null);
    }
  };

  const handleAddCustomInterest = () => {
    if (!newInterestInput.trim()) return;
    const trimmed = newInterestInput.trim();
    if (!interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
    }
    setNewInterestInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (photos.length < 1) {
      setError('Please add at least 1 clear profile photo.');
      return;
    }

    if (bio.trim().length < 10) {
      setError('Bio must be at least 10 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/profiles/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName,
          dateOfBirth,
          gender,
          datingPreference,
          relationshipIntention,
          state,
          city,
          bio,
          photos,
          interests,
          showOnlineStatus,
          showLocation
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      updateProfileState(data.profile);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008751]">
              Profile Setup
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Complete Your NaijaMatch Profile
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Present your authentic self to matches across Nigeria. High-quality profiles get 4x more mutual likes.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Photos */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Profile Photos (Add 1–5 Photos)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100"
                >
                  <img
                    src={photo.url}
                    alt={`Profile photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-[#008751] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-xs">
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(index, 'up')}
                        className="p-1 rounded bg-white text-slate-800 hover:bg-slate-200"
                        title="Move photo earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {index < photos.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(index, 'down')}
                        className="p-1 rounded bg-white text-slate-800 hover:bg-slate-200"
                        title="Move photo later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Tile */}
              {photos.length < 6 && (
                <label className="border-2 border-dashed border-slate-300 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#008751] hover:bg-emerald-50/30 transition-colors text-slate-500 hover:text-[#008751]">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold text-center px-1">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick URL Adder */}
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="Or paste an image URL..."
                className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="px-3 h-9 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Section 2: Identity & Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="e.g. Tunde or Amaka"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                max="2008-01-01"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                I am a
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
              >
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Looking for
              </label>
              <select
                value={datingPreference}
                onChange={(e) => setDatingPreference(e.target.value as DatingPreference)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Everyone">Everyone</option>
              </select>
            </div>
          </div>

          {/* Section 3: Intention & Nigerian Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dating Intention
              </label>
              <select
                value={relationshipIntention}
                onChange={(e) => setRelationshipIntention(e.target.value as RelationshipIntention)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
              >
                <option value="Serious Relationship">Serious Relationship</option>
                <option value="Casual Dating">Casual Dating</option>
                <option value="Friendship">Friendship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State of Residence
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as NigerianState)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Area
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="e.g. Ikeja, Maitama, GRA"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
              />
            </div>
          </div>

          {/* Section 4: Biography */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Biography
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              required
              placeholder="Tell potential matches about your values, career, passions, and what brings you to NaijaMatch..."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {bio.length} characters (minimum 10)
            </p>
          </div>

          {/* Section 5: Interests */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Interests & Hobbies (Select up to 8)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_INTERESTS.map((item) => {
                const selected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-[#008751] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item} {selected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Interest Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                placeholder="Add another hobby..."
                className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs focus:border-[#008751] outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-3 h-9 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Privacy Toggles */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Privacy & Presence Controls
            </h4>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-700">Display online status to other singles</span>
              <input
                type="checkbox"
                checked={showOnlineStatus}
                onChange={(e) => setShowOnlineStatus(e.target.checked)}
                className="rounded text-[#008751] focus:ring-[#008751]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-700">Display specific city location</span>
              <input
                type="checkbox"
                checked={showLocation}
                onChange={(e) => setShowLocation(e.target.checked)}
                className="rounded text-[#008751] focus:ring-[#008751]"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#008751] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Saving Profile...' : 'Save Profile & Start Matching'}
          </button>
        </form>
      </div>
    </div>
  );
};
