import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  BookOpen,
} from 'lucide-react';

const AttendanceStudent = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosClient.get('/attendance/my-summary');
        setSummary(res.data);
        if (res.data.courses && res.data.courses.length > 0) {
          setSelectedCourse(res.data.courses[0]);
        }
      } catch (error) {
        console.error('Error fetching student summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
      </div>
    );
  }

  const overallPercentage = summary?.overallPercentage ?? 100;
  const isOverallCritical = summary?.isOverallCritical;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-campus-600" />
          My Attendance Records
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time subject-wise tracking with 75% minimum criteria alerts
        </p>
      </div>

      {/* Critical Alert if < 75% */}
      {isOverallCritical && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-4 shadow-sm animate-pulse">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">
              ATTENDANCE SHORTAGE WARNING: {overallPercentage}% (Below 75%)
            </h4>
            <p className="mt-1 text-xs text-rose-700 leading-relaxed">
              University regulations require at least 75% attendance in every registered course to appear in semester exams.
              You currently have an attendance shortage. Please consult with your faculty immediately.
            </p>
          </div>
        </div>
      )}

      {/* Aggregate Overview Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overall Aggregate Rate
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span
                className={`text-4xl font-black ${
                  overallPercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {overallPercentage}%
              </span>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  overallPercentage >= 75
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {overallPercentage >= 75 ? 'Safe (≥ 75%)' : 'Critical Shortage (< 75%)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Attended {summary?.totalAttended} of {summary?.totalConducted} scheduled lecture sessions
            </p>
          </div>

          <div className="w-full sm:w-64">
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Registered Subjects & Criteria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary?.courses?.map((course) => {
            const isSelected = selectedCourse?.courseId === course.courseId;
            return (
              <div
                key={course.courseId}
                onClick={() => setSelectedCourse(course)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-campus-500 shadow-md ring-2 ring-campus-500/20'
                    : 'bg-white/80 border-slate-200/80 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                      {course.courseCode}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 mt-2">
                      {course.courseName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Faculty: {course.faculty}</p>
                  </div>

                  {/* Dynamic Color Badges: Green for >=75%, Red for <75% */}
                  <span
                    className={`text-sm font-black px-3 py-1 rounded-xl border ${
                      course.percentage >= 75
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    }`}
                  >
                    {course.percentage}%
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Classes: <strong className="text-slate-900">{course.attendedCount}</strong> / {course.totalClasses}
                  </span>
                  <span className="font-semibold text-campus-600">
                    {course.percentage >= 75 ? 'Eligible for Exams' : 'Shortage Alert'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session History Table */}
      {selectedCourse && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Session History: {selectedCourse.courseCode} ({selectedCourse.courseName})
              </h3>
              <p className="text-xs text-slate-400">
                Detailed timeline of dates, lecture topics, and marked attendance status
              </p>
            </div>
            <span
              className={`self-start sm:self-auto text-xs font-black px-3 py-1 rounded-xl border ${
                selectedCourse.percentage >= 75
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {selectedCourse.percentage}% Attendance Rate
            </span>
          </div>

          {selectedCourse.history?.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No sessions conducted yet for this subject.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Lecture Topic / Slot</th>
                    <th className="py-3 px-6 text-right">Recorded Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {selectedCourse.history?.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-sm font-semibold text-slate-700">
                        {new Date(session.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-900 text-xs">
                        {session.topic}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            session.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : session.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {session.status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {session.status === 'Absent' && <XCircle className="w-3.5 h-3.5" />}
                          {session.status === 'Late' && <Clock className="w-3.5 h-3.5" />}
                          <span>{session.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceStudent;
