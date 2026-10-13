import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  CalendarDays,
  AlertCircle,
  Sparkles,
  LogOut,
  DoorOpen,
  Search,
  UserCheck,
  GraduationCap,
  FileSpreadsheet,
  Database,
} from 'lucide-react';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'My Attendance', path: '/attendance/student', icon: CheckSquare },
          { name: 'Assignments', path: '/assignments', icon: BookOpen },
          { name: 'Campus Events', path: '/events', icon: CalendarDays },
          { name: 'Grievances', path: '/grievances', icon: AlertCircle },
          { name: 'Lost & Found', path: '/lost-found', icon: Search },
          { name: 'Room Booking', path: '/room-booking', icon: DoorOpen },
          { name: 'Campus AI', path: '/ai-chat', icon: Sparkles, highlight: true },
        ];
      case 'faculty':
        return [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Mark Attendance', path: '/attendance/faculty', icon: UserCheck },
          { name: 'Attendance Logs', path: '/attendance/student', icon: FileSpreadsheet },
          { name: 'Course Assignments', path: '/assignments', icon: BookOpen },
          { name: 'Room Booking', path: '/room-booking', icon: DoorOpen },
          { name: 'Campus Events', path: '/events', icon: CalendarDays },
          { name: 'Grievance Review', path: '/grievances', icon: AlertCircle },
          { name: 'Lost & Found', path: '/lost-found', icon: Search },
          { name: 'Campus AI', path: '/ai-chat', icon: Sparkles, highlight: true },
        ];
      case 'admin':
        return [
          { name: 'Master Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Bulk Onboarding', path: '/admin/onboarding', icon: Database },
          { name: 'Grievance Resolutions', path: '/grievances', icon: AlertCircle },
          { name: 'Room Approvals', path: '/room-booking', icon: DoorOpen },
          { name: 'Campus Events', path: '/events', icon: CalendarDays },
          { name: 'Attendance Logs', path: '/attendance/student', icon: FileSpreadsheet },
          { name: 'Lost & Found', path: '/lost-found', icon: Search },
          { name: 'Campus AI', path: '/ai-chat', icon: Sparkles, highlight: true },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'faculty':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'student':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-campus-700 to-campus-500 flex items-center justify-center text-white shadow-md shadow-campus-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1">
                Campus<span className="text-campus-600">One</span>
              </span>
              <span className="block text-xs font-semibold tracking-wider uppercase text-slate-400">
                Smart Campus OS
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path + link.name}
                to={link.path}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-campus-600 text-white shadow-sm shadow-campus-600/30'
                      : link.highlight
                      ? 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{link.name}</span>
                {link.highlight && (
                  <span className="ml-auto text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-campus-100 border border-campus-200 flex items-center justify-center text-campus-700 font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border capitalize ${getRoleBadgeColor()}`}
                >
                  {role}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {user?.rollOrFacultyId}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
