import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  DoorOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  X,
  Building,
} from 'lucide-react';

const COMMON_ROOMS = [
  'Seminar Hall A',
  'Seminar Hall B',
  'Auditorium Main',
  'Lab 201 (AI Lab)',
  'Lab 204 (Networks)',
  'Conference Room 1',
  'Conference Room 2',
];

const TIME_SLOTS = [
  '09:00 AM - 10:30 AM',
  '10:30 AM - 12:00 PM',
  '01:00 PM - 02:30 PM',
  '02:30 PM - 04:00 PM',
  '04:00 PM - 05:30 PM',
];

const RoomBooking = () => {
  const { user, role } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState(COMMON_ROOMS[0]);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/rooms');
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error fetching room bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!roomNumber || !bookingDate || !timeSlot || !purpose) return;

    setSubmitting(true);
    try {
      await axiosClient.post('/rooms', {
        roomNumber,
        date: bookingDate,
        timeSlot,
        purpose,
      });
      setMessage({ type: 'success', text: 'Room booking request submitted!' });
      setShowModal(false);
      setPurpose('');
      fetchBookings();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to request booking',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axiosClient.patch(`/rooms/${id}/status`, { status });
      fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-7 h-7 text-campus-600" />
            Campus Facility & Room Booking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reserve seminar spaces, computing laboratories, and auditoriums for academic events
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold shadow-md shadow-campus-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Room / Lab</span>
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

      {/* Bookings Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">
            Current Reservations & Requests ({bookings.length})
          </h3>
          <span className="text-xs text-slate-400">
            Real-time facility schedule
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-campus-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No room bookings requested yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Room / Facility</th>
                  <th className="py-3 px-6">Date & Slot</th>
                  <th className="py-3 px-6">Booked By & Purpose</th>
                  <th className="py-3 px-6">Status</th>
                  {(role === 'admin' || role === 'faculty') && (
                    <th className="py-3 px-6 text-right">Approval Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span>{b.roomNumber}</span>
                    </td>
                    <td className="py-3.5 px-6 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">
                        {new Date(b.date).toLocaleDateString()}
                      </div>
                      <span className="text-slate-500 font-mono text-xs">{b.timeSlot}</span>
                    </td>
                    <td className="py-3.5 px-6 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {b.bookedBy?.name || 'User'}
                      </span>
                      <p className="text-slate-500 line-clamp-1">{b.purpose}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          b.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : b.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    {(role === 'admin' || role === 'faculty') && (
                      <td className="py-3.5 px-6 text-right">
                        {b.status === 'Pending' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Book Room */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Facility Booking Request
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Room / Facility
                </label>
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                >
                  {COMMON_ROOMS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Purpose of Booking
                </label>
                <textarea
                  rows={3}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Club Coding Competition / Guest Lecture Practice..."
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
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomBooking;
