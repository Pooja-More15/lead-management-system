import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight, 
  Trash2, Edit, Eye
} from 'lucide-react';
import Button from '../components/Button';

const LeadsList = () => {
  const { hasPermission, user } = useAuth();
  const toast = useToast();
  
  // State
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const debouncedSearch = useDebounce(search, 400);

  // Fetch agents list for filter selection (managers/admins can assign)
  useEffect(() => {
    const fetchAgents = async () => {
      if (hasPermission('assign_leads')) {
        try {
          const res = await apiClient.get('/users/agents');
          setAgents(res.data.data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchAgents();
  }, [hasPermission]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        status,
        priority,
        assignedTo,
        sortBy,
        sortOrder,
      };
      
      const endpoint = user?.role === 'AGENT' ? '/leads/my-leads' : '/leads';
      const res = await apiClient.get(endpoint, { params });
      setLeads(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, priority, assignedTo, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await apiClient.delete(`/leads/${id}`);
        toast.success('Lead deleted successfully');
        fetchLeads();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete lead');
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getStatusStyle = (status) => {
    const styles = {
      NEW: 'bg-indigo-55/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30',
      CONTACTED: 'bg-amber-55/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30',
      QUALIFIED: 'bg-emerald-55/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30',
      LOST: 'bg-rose-55/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30',
    };
    return styles[status] || 'bg-slate-50 text-slate-700';
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      LOW: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/40',
      MEDIUM: 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/30',
      HIGH: 'bg-orange-50/70 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100/30',
      URGENT: 'bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100/30',
    };
    return styles[priority] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-slate-100 tracking-tight">Leads Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Leads Found: <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span></p>
        </div>
        {hasPermission('create_leads') && (
          <Link to="/leads/create">
            <Button variant="primary" className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-md shadow-indigo-500/10">
              <Plus className="w-4.5 h-4.5" /> Add Lead
            </Button>
          </Link>
        )}
      </div>

      {/* Filters Container */}
      <div className="card-premium p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative col-span-1 md:col-span-2">
            <input
              type="text"
              placeholder="Search by Name, Email or Phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100 font-medium text-slate-650"
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100 font-medium text-slate-650"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* Agent selection filter (admins/managers only) */}
          {hasPermission('assign_leads') && (
            <div>
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100 font-medium text-slate-650"
              >
                <option value="">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th onClick={() => handleSort('name')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Name <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th className="font-semibold">Email</th>
                <th className="font-semibold">Phone</th>
                <th className="font-semibold">Source</th>
                <th onClick={() => handleSort('priority')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Priority <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th onClick={() => handleSort('status')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Status <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th className="font-semibold">Assigned Agent</th>
                <th className="text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/80 animate-pulse">
                    <td className="h-14"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" /></td>
                    <td><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                    <td><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" /></td>
                    <td><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No leads found matching query filters.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-800/40 table-row-hover">
                    <td className="font-semibold text-slate-800 dark:text-slate-200">{lead.name}</td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">{lead.email}</td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">{lead.phone}</td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">{lead.source}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityStyle(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      {lead.agent ? lead.agent.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/leads/${lead.id}`}>
                          <button className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {hasPermission('update_assigned_leads') && (
                          <Link to={`/leads/${lead.id}/edit`}>
                            <button className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors" title="Edit Lead">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                        {hasPermission('manage_leads') && (
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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
                className="flex items-center gap-1"
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1"
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

export default LeadsList;
