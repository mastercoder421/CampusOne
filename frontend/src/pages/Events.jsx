import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Event creation modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [clubName, setClubName] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/events');
      setEvents(res.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleRsvp = async (eventId) => {
    setActionLoadingId(eventId);
    try {
      const res = await axiosClient.post(`/events/${eventId}/rsvp`);
      if (res.data.success) {
        // Update local state smoothly
        setEvents((prev) =>
          prev.map((e) => (e._id === eventId ? res.data.event : e))
        );
      }
    } catch (error) {
      console.error('Error toggling RSVP:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title || !description || !date || !venue || !clubName) return;

    setCreating(true);
    try {
      await axiosClient.post('/events', {
        title,
        description,
        date,
        venue,
        clubName,
      });
      setMessage({ type: 'success', text: 'Campus event published successfully!' });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setDate('');
      setVenue('');
      setClubName('');
      fetchEvents();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create event',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-campus-600" />
            Campus Life & Club Events
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Discover fests, workshops, and student society meetups across the university
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold shadow-md shadow-campus-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Event</span>
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

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">No campus events currently scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => {
            const hasRsvp = ev.rsvps?.some(
              (r) => (r._id || r) === user._id
            );
            const rsvpCount = ev.rsvps?.length || 0;

            return (
              <div
                key={ev._id}
                className="glass-card p-6 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {ev.clubName}
                    </span>
                    <span className="text-sm font-bold text-campus-600">
                      {new Date(ev.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-800">{rsvpCount}</strong> attending
                      </span>
                    </div>
                  </div>

                  {/* Interactive RSVP Toggle Button */}
                  <button
                    onClick={() => handleToggleRsvp(ev._id)}
                    disabled={actionLoadingId === ev._id}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      hasRsvp
                        ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800'
                        : 'bg-campus-600 hover:bg-campus-700 text-white shadow-sm'
                    }`}
                  >
                    {actionLoadingId === ev._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : hasRsvp ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Attending (Click to Cancel RSVP)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>RSVP Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Publish Campus Event
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Symposium 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Club / Organizing Body
                  </label>
                  <input
                    type="text"
                    required
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g. Turing Coding Club"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Campus Venue
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Auditorium Main Hall or Seminar Hall B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, prize categories, guest speakers, or requirements..."
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
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
