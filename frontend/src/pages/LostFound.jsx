import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  Search,
  Plus,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Tag,
} from 'lucide-react';

const LostFound = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);

  // Report modal
  const [showModal, setShowModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [type, setType] = useState('Lost');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const url =
        filterType === 'All'
          ? '/lost-found'
          : `/lost-found?type=${filterType}`;
      const res = await axiosClient.get(url);
      setItems(res.data.items || []);
    } catch (error) {
      console.error('Error fetching lost and found items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!itemTitle || !description || !location || !contactInfo) return;

    setSubmitting(true);
    try {
      await axiosClient.post('/lost-found', {
        itemTitle,
        type,
        description,
        location,
        contactInfo,
      });
      setMessage({ type: 'success', text: 'Item notice reported successfully!' });
      setShowModal(false);
      setItemTitle('');
      setDescription('');
      setLocation('');
      setContactInfo('');
      fetchItems();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to report item',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (id) => {
    try {
      await axiosClient.patch(`/lost-found/${id}/resolve`);
      fetchItems();
    } catch (error) {
      console.error('Error toggling resolve status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-campus-600" />
            Lost & Found Bulletin
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Report lost belongings or claim items retrieved around the campus grounds
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold shadow-md shadow-campus-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report Item</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['All', 'Lost', 'Found'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === f
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'All' ? 'All Notices' : `${f} Items`}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">No notices reported in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item._id}
              className={`glass-card p-6 flex flex-col justify-between transition-all ${
                item.isResolved ? 'opacity-60 bg-slate-50/70' : 'hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      item.type === 'Lost'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {item.type}
                  </span>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      item.isResolved
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {item.isResolved ? 'Resolved / Claimed' : 'Active Notice'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900">{item.itemTitle}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: {item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{item.contactInfo}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleResolve(item._id)}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    item.isResolved
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {item.isResolved ? 'Mark as Unresolved' : 'Mark as Claimed / Resolved'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Report Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Report Item Notice
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReport} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notice Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('Lost')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      type === 'Lost'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    I Lost an Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Found')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      type === 'Found'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    I Found an Item
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Blue HP Laptop Charger"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Location (Where lost or found)
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Central Library 2nd Floor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Information
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g. student@campusone.edu or phone number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Item Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide identifying features, serial marks, stickers, color..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Post Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
