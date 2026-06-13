import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Bell, Clock, Info, User, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Notifications = () => {
  const toast = useToast();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = useCallback(async (pageNum = page, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await apiClient.get('/logs', {
        params: { page: pageNum, limit: 10 }
      });
      setNotifications(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket connection for real-time notification alerts
  useEffect(() => {
    if (socket) {
      const handleRefresh = () => {
        fetchNotifications(1, true); // Refresh page 1 silently on new activities
      };

      const handleAssigned = (data) => {
        toast.info(data.message || 'A new lead has been assigned to you');
        fetchNotifications(1, true);
      };

      socket.on('dashboard:refresh', handleRefresh);
      socket.on('lead:assigned', handleAssigned);

      return () => {
        socket.off('dashboard:refresh', handleRefresh);
        socket.off('lead:assigned', handleAssigned);
      };
    }
  }, [socket, fetchNotifications, toast]);

  const getActionStyles = (action) => {
    switch (action) {
      case 'LEAD_CREATED':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/40',
          icon: Bell,
        };
      case 'LEAD_ASSIGNED':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/40',
          icon: User,
        };
      case 'STATUS_CHANGED':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/40',
          icon: CheckCircle2,
        };
      case 'USER_DEACTIVATED':
      case 'LEAD_DELETED':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/40',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 border-slate-200/40',
          icon: Info,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Notifications & Activity Stream
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real-time record of system actions, lead movements, and account logins.
        </p>
      </div>

      {/* Notifications Container */}
      <div className="card-premium overflow-hidden">
        {loading && page === 1 ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-150 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-slate-450 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No recent notifications logged.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.map((notif) => {
              const styles = getActionStyles(notif.action);
              const Icon = styles.icon;
              return (
                <div 
                  key={notif.id} 
                  className="p-5 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                >
                  <div className={`p-2.5 rounded-xl border ${styles.bg} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {notif.action.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-350 text-sm font-semibold mt-1">
                      {notif.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                      {notif.user && (
                        <span>By: <span className="font-semibold text-slate-500 dark:text-slate-400">{notif.user.name}</span></span>
                      )}
                      {notif.ipAddress && (
                        <span>IP: <span className="font-medium">{notif.ipAddress}</span></span>
                      )}
                    </div>
                  </div>
                  {notif.leadId && (
                    <Link 
                      to={`/leads/${notif.leadId}`}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex-shrink-0 self-center"
                      title="View Lead Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => { setPage(page - 1); fetchNotifications(page - 1); }}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === pages}
                onClick={() => { setPage(page + 1); fetchNotifications(page + 1); }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
