import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  Filter,
  Loader2,
  X,
  MessageSquare,
  Building,
  Utensils,
  BookOpen,
  Wrench,
} from 'lucide-react';

const CATEGORIES = ['Hostel', 'Academic', 'Mess', 'Maintenance'];

const Grievances = () => {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // New ticket modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hostel');
  const [creating, setCreating] = useState(false);

  // Admin resolution modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusInput, setStatusInput] = useState('In Progress');
  const [notesInput, setNotesInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const [message, setMessage] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const url =
        selectedCategory === 'All'
          ? '/complaints'
          : `/complaints?category=${selectedCategory}`;
      const res = await axiosClient.get(url);
      setComplaints(res.data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [selectedCategory]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) return;

    setCreating(true);
    try {
      await axiosClient.post('/complaints', {
        title,
        description,
        category,
      });
      setMessage({ type: 'success', text: 'Grievance ticket lodged successfully!' });
      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchComplaints();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit grievance',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      await axiosClient.patch(`/complaints/${selectedTicket._id}/status`, {
        status: statusInput,
        resolutionNotes: notesInput,
      });
      setMessage({ type: 'success', text: `Ticket updated to ${statusInput}` });
      setSelectedTicket(null);
      fetchComplaints();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update ticket',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Hostel':
        return Building;
      case 'Mess':
        return Utensils;
      case 'Academic':
        return BookOpen;
      case 'Maintenance':
      default:
        return Wrench;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-600" />
            Campus Grievance Redressal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lodge complaints, monitor maintenance requests, and track administrative resolutions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lodge Grievance</span>
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

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-campus-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Complaint Tickets List */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">No grievance tickets found in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => {
            const CatIcon = getCategoryIcon(item.category);
            return (
              <div key={item._id} className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 mt-1 flex-shrink-0">
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: #{item._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                        <span>Filed by: {item.studentId?.name || 'Student'}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Status Timeline */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'Pending'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        Pending
                      </span>
                      <span className="text-slate-300">➔</span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'In Progress'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        In Progress
                      </span>
                      <span className="text-slate-300">➔</span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        Resolved
                      </span>
                    </div>

                    {(role === 'admin' || role === 'faculty') && (
                      <button
                        onClick={() => {
                          setSelectedTicket(item);
                          setStatusInput(item.status);
                          setNotesInput(item.resolutionNotes || '');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Update Resolution
                      </button>
                    )}
                  </div>
                </div>

                {/* Resolution Notes Box if provided */}
                {item.resolutionNotes && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900">Official Resolution Note: </strong>
                      <span>{item.resolutionNotes}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Lodge Grievance */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Lodge Grievance Ticket
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Issue Summary / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi router drop in Block C"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Detailed Description & Location
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise location, room number, equipment identifier, and symptoms..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500"
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Submitting...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Resolution Update */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Update Ticket Status & Notes
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-slate-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Explain actions taken, technician dispatch details, or resolution status..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Updating...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grievances;
