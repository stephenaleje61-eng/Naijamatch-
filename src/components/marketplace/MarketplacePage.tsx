import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Plus, Search, Tag, MapPin, ShieldCheck,
  MessageSquare, Trash2, AlertCircle, X, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MarketplaceListing, NIGERIAN_STATES, NigerianState } from '../../types/index.ts';
import giftsBannerImg from '../../assets/images/naija_date_gifts_1791718902882.jpg';

interface MarketplacePageProps {
  onContactSeller: (sellerUserId: string) => void;
  onOpenSubscriptions: () => void;
}

const CATEGORIES = ['All', 'Fashion', 'Gifts', 'Date Ideas', 'Other Services'];

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onContactSeller,
  onOpenSubscriptions
}) => {
  const { token, user, subscription, profile } = useAuth();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create Listing Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Fashion' | 'Gifts' | 'Date Ideas' | 'Other Services'>('Gifts');
  const [newPrice, setNewPrice] = useState('');
  const [newState, setNewState] = useState<NigerianState>('Lagos');
  const [newCity, setNewCity] = useState('Lekki');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchListings = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'All') params.append('category', selectedCategory);
    if (selectedState !== 'All') params.append('state', selectedState);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());

    try {
      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (e) {
      console.error('Error fetching marketplace listings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedState]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!user) {
      setCreateError('You must be signed in to create a marketplace listing.');
      return;
    }

    if (!subscription && user.role !== 'admin') {
      setCreateError('Creating marketplace listings requires an active monthly or 3-month membership subscription.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          category: newCategory,
          priceNGN: Number(newPrice),
          state: newState,
          city: newCity,
          images: newImageUrl ? [newImageUrl] : [
            'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
          ]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');

      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewPrice('');
      setNewImageUrl('');
      fetchListings();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Remove this listing from the marketplace?')) return;
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setListings(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      alert('Failed to delete listing');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Editorial Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white mb-10 shadow-lg border border-slate-200">
        <div className="absolute inset-0 opacity-40">
          <img
            src={giftsBannerImg}
            alt="Date ideas and gifts in Nigeria"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 p-8 sm:p-12 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NaijaMatch Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Date Ideas, Gifts & Romance
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Curated date experiences, romantic surprises, artisanal gift boxes, and verified fashion items for singles and couples across Nigeria.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (!subscription && user?.role !== 'admin') {
                  onOpenSubscriptions();
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Post Item or Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8">
        {/* Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* State filter & Search */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 outline-hidden"
          >
            <option value="All">All States (Nigeria)</option>
            {NIGERIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
              placeholder="Search gifts, dates..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 text-xs focus:border-[#008751] outline-hidden bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          Loading marketplace listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No items found in this category</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try switching category or state filters, or be the first to post a romantic date package!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const isOwner = user?.id === item.userId || user?.role === 'admin';
            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/10 relative overflow-hidden bg-slate-100">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-lg font-black text-[#008751] font-mono tabular-nums">
                        ₦{item.priceNGN.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.city}, {item.state}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.seller && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {item.seller.avatarUrl ? (
                            <img
                              src={item.seller.avatarUrl}
                              alt={item.seller.displayName}
                              className="w-5 h-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <span className="font-semibold text-slate-700">
                            {item.seller.displayName}
                          </span>
                          {item.seller.isIdentityVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#008751]" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => onContactSeller(item.userId)}
                    className="flex-1 py-2.5 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contact Seller</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Remove Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
              Post Marketplace Listing
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Offer gifts, date packages, or fashion pieces to Nigerian singles.
            </p>

            {createError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Listing Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Scented Candle Date Night Hamper"
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-white outline-hidden"
                  >
                    <option value="Gifts">Gifts</option>
                    <option value="Date Ideas">Date Ideas</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Other Services">Other Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (NGN)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    min="1000"
                    placeholder="15000"
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={newState}
                    onChange={(e) => setNewState(e.target.value as NigerianState)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-white outline-hidden"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Area
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    required
                    placeholder="e.g. Lekki Phase 1"
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail what is included, delivery or meeting terms..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/item.jpg"
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-sm disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
