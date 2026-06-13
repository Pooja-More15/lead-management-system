import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { ClipboardList } from 'lucide-react';
import Button from '../components/Button';

const ActivityLogs = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/logs', {
        params: { page, limit: 15 },
      });
      setLogs(res.data.data);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-600" /> Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Complete system transaction audits, client IP, and agent details tracking.</p>
      </div>

      {/* Grid Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <th>Action</th>
                <th>Description</th>
                <th>Operator</th>
                <th>Client Context</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/80 animate-pulse">
                    <td className="h-12"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-xs transition-all">
                    <td>
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-slate-700 dark:text-slate-300 max-w-md truncate font-medium" title={log.description}>
                      {log.description}
                    </td>
                    <td className="font-semibold text-slate-850 dark:text-slate-200">
                      {log.user ? log.user.name : <span className="text-slate-400">System</span>}
                    </td>
                    <td className="text-[10px] text-slate-400 leading-tight">
                      <p className="font-bold">IP: {log.ipAddress || '127.0.0.1'}</p>
                      <p className="max-w-[150px] truncate" title={log.userAgent}>UA: {log.userAgent || 'Unknown'}</p>
                    </td>
                    <td className="text-slate-505 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
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
                onClick={() => setPage(page - 1)}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
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

export default ActivityLogs;
