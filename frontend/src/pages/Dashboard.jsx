import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Sparkles,
  ArrowRight,
  DoorOpen,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Database,
} from 'lucide-react';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [studentSummary, setStudentSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [roomBookings, setRoomBookings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (role === 'student') {
          const [summaryRes, eventsRes, complaintsRes] = await Promise.all([
            axiosClient.get('/attendance/my-summary'),
            axiosClient.get('/events'),
            axiosClient.get('/complaints'),
          ]);
          setStudentSummary(summaryRes.data);
          setEvents(eventsRes.data.events || []);
          setComplaints(complaintsRes.data.complaints || []);
        } else if (role === 'faculty') {
          const [coursesRes, eventsRes, roomsRes] = await Promise.all([
            axiosClient.get('/attendance/courses'),
            axiosClient.get('/events'),
            axiosClient.get('/rooms'),
          ]);
          setCourses(coursesRes.data.courses || []);
          setEvents(eventsRes.data.events || []);
          setRoomBookings(roomsRes.data.bookings || []);
        } else if (role === 'admin') {
          const [coursesRes, complaintsRes, roomsRes, eventsRes] = await Promise.all([
            axiosClient.get('/attendance/courses'),
            axiosClient.get('/complaints'),
            axiosClient.get('/rooms'),
            axiosClient.get('/events'),
          ]);
          setCourses(coursesRes.data.courses || []);
          setComplaints(complaintsRes.data.complaints || []);
          setRoomBookings(roomsRes.data.bookings || []);
          setEvents(eventsRes.data.events || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT VIEW
  // ==========================================
  if (role === 'student') {
    const isCritical = studentSummary?.isOverallCritical;
    const overallPercentage = studentSummary?.overallPercentage ?? 100;
    const pendingComplaints = complaints.filter((c) => c.status !== 'Resolved').length;

    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-campus-900 to-campus-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide text-campus-200 mb-3">
              <Award className="w-3.5 h-3.5" /> Student Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hello, {user?.name}! 👋
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Department of {user?.department} • Roll No: {user?.rollOrFacultyId}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/attendance/student"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm"
              >
                <span>View Full Attendance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/ai-chat"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/30 border border-purple-400/40 text-purple-200 font-bold text-sm hover:bg-purple-500/40 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask CampusBot AI</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Critical Alert Badge if < 75% */}
        {isCritical && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-4 shadow-sm animate-pulse">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                CRITICAL WARNING: Attendance Below 75% Minimum Criteria ({overallPercentage}%)
              </h4>
              <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                Your current aggregate attendance has fallen below the mandatory 75% university requirement.
                You are at risk of debarment from end-semester examinations.
                Please contact your course faculty advisor immediately.
              </p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attendance Rate
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                  overallPercentage >= 75
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {overallPercentage >= 75 ? 'Safe (≥75%)' : 'Critical (<75%)'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-3xl font-black ${
                  overallPercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {overallPercentage}%
              </span>
              <span className="text-xs text-slate-400">
                ({studentSummary?.totalAttended} / {studentSummary?.totalConducted} classes)
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Enrolled Courses
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">
                {studentSummary?.courses?.length || 0}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Active academic subjects</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Campus Events
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">{events.length}</span>
              <p className="text-xs text-slate-400 mt-0.5">Upcoming club activities</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Grievances
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">{complaints.length}</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {pendingComplaints} in progress / pending
              </p>
            </div>
          </div>
        </div>

        {/* Per-Course Summary */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Subject Attendance Progress
              </h3>
              <p className="text-xs text-slate-500">
                Requires minimum 75% attendance for examination eligibility
              </p>
            </div>
            <Link
              to="/attendance/student"
              className="text-xs font-bold text-campus-600 hover:text-campus-700 flex items-center gap-1"
            >
              <span>View Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {studentSummary?.courses?.map((course) => (
              <div
                key={course.courseId}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {course.courseCode}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-medium text-sm text-slate-700">
                      {course.courseName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Faculty: <span className="font-semibold text-slate-700">{course.faculty}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Attended / Total</span>
                    <p className="font-bold text-sm text-slate-800">
                      {course.attendedCount} / {course.totalClasses} classes
                    </p>
                  </div>

                  <span
                    className={`text-base font-black px-3 py-1 rounded-xl border ${
                      course.percentage >= 75
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {course.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // FACULTY VIEW
  // ==========================================
  if (role === 'faculty') {
    const totalEnrolled = courses.reduce(
      (acc, c) => acc + (c.enrolledStudents ? c.enrolledStudents.length : 0),
      0
    );

    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Faculty Dashboard
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.name}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Department of {user?.department} • Faculty ID: {user?.rollOrFacultyId}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/attendance/faculty"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <span>Take Attendance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/assignments"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
              >
                <span>Post Assignment</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Courses Taught
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">{courses.length}</span>
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Undergraduate lecture modules</p>
          </div>

          <div className="glass-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enrolled Students
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">{totalEnrolled}</span>
              <Users className="w-5 h-5 text-campus-600" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Total active cohort</p>
          </div>

          <div className="glass-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Room Bookings
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">{roomBookings.length}</span>
              <DoorOpen className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Seminar halls & laboratories</p>
          </div>

          <div className="glass-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Campus Events
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">{events.length}</span>
              <CalendarDays className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Upcoming club activities</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">Assigned Courses</h3>
            <Link
              to="/attendance/faculty"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Mark Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course._id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-all shadow-sm"
              >
                <div>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {course.courseCode}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 mt-2">
                    {course.courseName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{course.department}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    👥 {course.enrolledStudents?.length || 0} students
                  </span>
                  <button
                    onClick={() => navigate('/attendance/faculty')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN VIEW
  // ==========================================
  const pendingRooms = roomBookings.filter((b) => b.status === 'Pending').length;
  const pendingComplaints = complaints.filter((c) => c.status === 'Pending').length;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-semibold text-purple-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Campus Administrator
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Administrative Console
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            System Operations • Institutional Governance • Campus Oversight
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>Bulk Student & Course Onboarding</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/grievances"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              <span>Resolve Grievances ({pendingComplaints})</span>
            </Link>
            <Link
              to="/room-booking"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              <span>Approve Rooms ({pendingRooms})</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Open Grievances
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600">{pendingComplaints}</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Pending resolution</p>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Room Requests
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600">{pendingRooms}</span>
            <DoorOpen className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Awaiting approval</p>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Courses
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{courses.length}</span>
            <BookOpen className="w-5 h-5 text-campus-600" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Departments active</p>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Campus Events
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{events.length}</span>
            <CalendarDays className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Scheduled activities</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
