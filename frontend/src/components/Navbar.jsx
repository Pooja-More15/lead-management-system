import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Bell, Menu, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useSocket();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Hamburger Toggle */}
      <button 
        onClick={toggleSidebar}
        className="p-2 md:hidden rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <span>Welcome back,</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-xl py-2 z-50 text-slate-700 dark:text-slate-200">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="font-bold text-sm">Notifications</span>
                <div className="flex gap-2.5">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/40 flex items-start gap-3 transition-colors ${!notif.read ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
                    >
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${!notif.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5 hover:underline"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="px-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <Link 
                  to="/leads" 
                  onClick={() => setShowDropdown(false)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  View all leads
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
