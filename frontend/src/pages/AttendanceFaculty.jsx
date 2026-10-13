import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Calendar,
  BookOpen,
} from 'lucide-react';

const AttendanceFaculty = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [topicOrSlot, setTopicOrSlot] = useState('Lecture Session');
  const [roster, setRoster] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axiosClient.get('/attendance/courses');
        const list = res.data.courses || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0]._id);
        }
      } catch (error) {
        console.error('Error fetching faculty courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchStudents = async () => {
      setLoadingRoster(true);
      setFeedback(null);
      try {
        const res = await axiosClient.get(`/attendance/course/${selectedCourseId}/students`);
        const students = res.data.students || [];
        setRoster(students);

        const initialMap = {};
        students.forEach((s) => {
          initialMap[s._id] = 'Present';
        });
        setAttendanceMap(initialMap);
      } catch (error) {
        console.error('Error fetching course students:', error);
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchStudents();
  }, [selectedCourseId]);

  const handleMarkAll = (status) => {
    const newMap = {};
    roster.forEach((s) => {
      newMap[s._id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setSubmitting(true);
    setFeedback(null);

    const records = roster.map((s) => ({
      studentId: s._id,
      status: attendanceMap[s._id] || 'Present',
    }));

    try {
      const res = await axiosClient.post('/attendance/mark', {
        courseId: selectedCourseId,
        date: sessionDate,
        topicOrSlot,
        records,
      });

      setFeedback({
        type: 'success',
        message: `Attendance marked successfully for ${records.length} students in session "${topicOrSlot}"!`,
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit attendance',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'Late').length;

  if (loadingCourses) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-emerald-600" />
          Mark Session Attendance
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Take roll call and persist session records with automated database upsert
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Course & Date Bar */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 text-sm font-semibold text-slate-800 outline-none"
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode}: {course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 text-sm font-semibold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Topic / Slot
            </label>
            <input
              type="text"
              value={topicOrSlot}
              onChange={(e) => setTopicOrSlot(e.target.value)}
              placeholder="Lecture Session"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 text-sm font-semibold text-slate-800 outline-none"
            />
          </div>
        </div>

        {/* Helper Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Helper:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('Present')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold transition-colors cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              Present: {presentCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
              Absent: {absentCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
              Late: {lateCount}
            </span>
          </div>
        </div>
      </div>

      {/* Roster Table with Radio Pills */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">
            Student Cohort ({roster.length} Enrolled)
          </h3>
          <span className="text-xs text-slate-400">
            Select status pill for each enrolled student
          </span>
        </div>

        {loadingRoster ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading student roster...</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No students enrolled in this course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Roll No</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6 text-right">Status Pill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {roster.map((student) => {
                  const currentStatus = attendanceMap[student._id] || 'Present';
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800 text-sm">
                        {student.rollOrFacultyId}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {student.name}
                        <span className="block text-xs font-normal text-slate-500">
                          {student.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'Present')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'Absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'Late')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'Late'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total students to save: <span className="font-bold text-slate-900">{roster.length}</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || roster.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Records...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Attendance Records</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFaculty;
