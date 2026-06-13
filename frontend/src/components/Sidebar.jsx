import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  History,
  User, 
  LogOut,
  X,
  Building2,
  Bell
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const links = [];

  // Dashboard - For all
  links.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });

  // Users - Admin only
  if (user?.role === 'ADMIN') {
    links.push({ name: 'Users', path: '/users', icon: Users });
  }

  // Leads / My Leads
  if (user?.role === 'AGENT') {
    links.push({ name: 'My Leads', path: '/leads', icon: ClipboardList });
  } else {
    links.push({ name: 'Leads', path: '/leads', icon: ClipboardList });
  }

  // Activity Logs - Admin only
  if (user?.role === 'ADMIN') {
    links.push({ name: 'Activity Logs', path: '/logs', icon: History });
  }

  // Notifications - For all
  links.push({ name: 'Notifications', path: '/notifications', icon: Bell });

  // Profile - For all
  links.push({ name: 'Profile', path: '/profile', icon: User });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/40 dark:border-slate-800/50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between`}>
        <div>
          {/* Header/Logo */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                Waanee CRM
              </span>
            </div>
            <button onClick={toggleSidebar} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              if (link.permission && !hasPermission(link.permission)) return null;

              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => { if (window.innerWidth < 768) toggleSidebar(); }}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 uppercase text-sm">
              {user?.name?.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate dark:text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
