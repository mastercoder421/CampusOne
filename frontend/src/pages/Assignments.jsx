import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Loader2,
  Award,
  Send,
  X,
} from 'lucide-react';

const Assignments = () => {
  const { user, role } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Faculty creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  // Student submission drawer
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Faculty grading modal
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [gradeInput, setGradeInput] = useState('A');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [grading, setGrading] = useState(false);

  const [message, setMessage] = useState(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const [assRes, coursesRes] = await Promise.all([
        axiosClient.get('/assignments'),
        axiosClient.get('/attendance/courses'),
      ]);
      setAssignments(assRes.data.assignments || []);
      const courseList = coursesRes.data.courses || [];
      setCourses(courseList);
      if (courseList.length > 0) {
        setNewCourseId(courseList[0]._id);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newCourseId || !newDeadline) return;

    setCreating(true);
    try {
      await axiosClient.post('/assignments/create', {
        title: newTitle,
        description: newDescription,
        courseId: newCourseId,
        deadline: newDeadline,
      });
      setMessage({ type: 'success', text: 'Assignment published successfully!' });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchAssignments();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create assignment',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionContent) return;

    setSubmitting(true);
    try {
      await axiosClient.post(`/assignments/${selectedAssignment._id}/submit`, {
        submissionTextOrUrl: submissionContent,
      });
      setMessage({ type: 'success', text: 'Assignment submitted successfully!' });
      setSelectedAssignment(null);
      setSubmissionContent('');
      fetchAssignments();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit assignment',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradingAssignment || !selectedStudentId) return;

    setGrading(true);
    try {
      await axiosClient.put(`/assignments/${gradingAssignment._id}/grade`, {
        studentId: selectedStudentId,
        grade: gradeInput,
        feedback: feedbackInput,
      });
      setMessage({ type: 'success', text: 'Submission graded successfully!' });
      setGradingAssignment(null);
      fetchAssignments();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit grade',
      });
    } finally {
      setGrading(false);
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
            <BookOpen className="w-7 h-7 text-campus-600" />
            Course Assignments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage assignment deliverables, submissions, and academic evaluations
          </p>
        </div>

        {(role === 'faculty' || role === 'admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold shadow-md shadow-campus-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
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

      {/* Assignment List */}
      {assignments.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold">No active assignments posted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignments.map((item) => {
            // Find current student submission if student
            const studentSubmission =
              role === 'student'
                ? item.submissions?.find(
                    (s) =>
                      s.studentId &&
                      (s.studentId._id === user._id || s.studentId === user._id)
                  )
                : null;

            const isSubmitted = !!studentSubmission;
            const isGraded = !!studentSubmission?.grade;

            return (
              <div
                key={item._id}
                className="glass-card p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-campus-50 text-campus-700 border border-campus-200 font-mono">
                      {item.courseId?.courseCode || 'COURSE'}
                    </span>

                    {/* Status Badges */}
                    {role === 'student' && (
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isGraded
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : isSubmitted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isGraded
                          ? `Graded: ${studentSubmission.grade}`
                          : isSubmitted
                          ? 'Submitted'
                          : 'Pending'}
                      </span>
                    )}

                    {(role === 'faculty' || role === 'admin') && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.submissions?.length || 0} Submissions
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 mt-3">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(item.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-slate-400">
                      Instructor: {item.facultyId?.name || 'Faculty'}
                    </span>
                  </div>

                  {/* Student Submission Feedback Banner */}
                  {role === 'student' && isGraded && (
                    <div className="mb-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                      <span className="font-bold">Evaluation Feedback: </span>
                      {studentSubmission.feedback || 'Good job!'}
                    </div>
                  )}

                  {/* Actions */}
                  {role === 'student' && (
                    <button
                      onClick={() => {
                        setSelectedAssignment(item);
                        setSubmissionContent(
                          studentSubmission?.submissionTextOrUrl ||
                            studentSubmission?.contentOrLink ||
                            ''
                        );
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSubmitted
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-campus-600 hover:bg-campus-700 text-white shadow-sm'
                      }`}
                    >
                      {isSubmitted ? 'Update Submission' : 'Submit Assignment'}
                    </button>
                  )}

                  {(role === 'faculty' || role === 'admin') && (
                    <button
                      onClick={() => {
                        setGradingAssignment(item);
                        if (item.submissions && item.submissions.length > 0) {
                          setSelectedStudentId(item.submissions[0].studentId?._id || '');
                          setGradeInput(item.submissions[0].grade || 'A');
                          setFeedbackInput(item.submissions[0].feedback || '');
                        }
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Review & Grade Submissions ({item.submissions?.length || 0})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Faculty Create Assignment */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Create New Assignment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Binary Search Tree Implementation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Course
                </label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode}: {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Submission Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Instructions & Specifications
                </label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter problem specifications, test cases, and grading criteria..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-normal outline-none focus:border-campus-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Student Submit Assignment */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase text-campus-600">
                  {selectedAssignment.courseId?.courseCode}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">
                  Submit: {selectedAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Repository URL or Solution Text
                </label>
                <textarea
                  rows={5}
                  required
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="https://github.com/my-username/assignment-repo or written answer..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-normal outline-none focus:border-campus-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Faculty Grade Submissions */}
      {gradingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase text-campus-600">
                  Evaluation
                </span>
                <h3 className="font-extrabold text-base text-slate-900">
                  Grade: {gradingAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setGradingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {gradingAssignment.submissions?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No submissions have been received yet for this assignment.
              </div>
            ) : (
              <form onSubmit={handleGradeSubmission} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Select Student Submission
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedStudentId(id);
                      const sub = gradingAssignment.submissions.find(
                        (s) => s.studentId?._id === id
                      );
                      if (sub) {
                        setGradeInput(sub.grade || 'A');
                        setFeedbackInput(sub.feedback || '');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-campus-500"
                  >
                    {gradingAssignment.submissions.map((s) => (
                      <option key={s._id} value={s.studentId?._id}>
                        {s.studentId?.name} ({s.studentId?.rollOrFacultyId}) -{' '}
                        {s.grade ? `Graded: ${s.grade}` : 'Pending'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Current Submission content */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="block font-bold text-slate-900 mb-1">Submitted Content:</span>
                  <p className="break-all font-mono">
                    {gradingAssignment.submissions.find(
                      (s) => s.studentId?._id === selectedStudentId
                    )?.submissionTextOrUrl ||
                      gradingAssignment.submissions.find(
                        (s) => s.studentId?._id === selectedStudentId
                      )?.contentOrLink ||
                      'No content'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Grade
                    </label>
                    <select
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-campus-500"
                    >
                      <option value="A+">A+ (Outstanding)</option>
                      <option value="A">A (Excellent)</option>
                      <option value="B+">B+ (Very Good)</option>
                      <option value="B">B (Good)</option>
                      <option value="C">C (Satisfactory)</option>
                      <option value="F">F (Fail)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Feedback
                    </label>
                    <input
                      type="text"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="e.g. Well documented code!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-campus-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setGradingAssignment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={grading}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {grading ? 'Saving...' : 'Save Grade'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
