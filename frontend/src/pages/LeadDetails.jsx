import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Calendar, User, Phone, Mail, 
  MapPin, Info, ClipboardList, Clock, MessageSquare 
} from 'lucide-react';
import Button from '../components/Button';

const LeadDetails = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLeadDetails = useCallback(async () => {
    try {
      const res = await apiClient.get(`/leads/${id}`);
      setLead(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch lead details');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
          <div className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link to="/leads" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
        {hasPermission('update_assigned_leads') && (
          <Link to={`/leads/${id}/edit`}>
            <Button variant="secondary" className="flex items-center gap-2 rounded-xl">
              <Edit className="w-4 h-4" /> Edit Lead
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main profile card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-xl p-6 shadow-sm space-y-6">
          {/* Header detail */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full uppercase">
                {lead.source} Source
              </span>
              <h1 className="text-2xl font-bold dark:text-slate-100 mt-2">{lead.name}</h1>
              <p className="text-xs text-slate-400 mt-1">Lead ID: {lead.id}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                lead.status === 'NEW' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' :
                lead.status === 'CONTACTED' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                lead.status === 'QUALIFIED' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              }`}>
                {lead.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                lead.priority === 'LOW' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' :
                lead.priority === 'MEDIUM' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                lead.priority === 'HIGH' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' :
                'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              }`}>
                {lead.priority} Priority
              </span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-slate-650 dark:text-slate-350">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</p>
                <a href={`mailto:${lead.email}`} className="text-sm font-medium hover:underline text-indigo-600 dark:text-indigo-400">{lead.email}</a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-650 dark:text-slate-350">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone</p>
                <a href={`tel:${lead.phone}`} className="text-sm font-medium hover:underline text-slate-700 dark:text-slate-300">{lead.phone}</a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-650 dark:text-slate-350">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned Agent</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {lead.agent ? lead.agent.name : 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-650 dark:text-slate-350">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Created At</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Notes description */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wider">Lead Notes & Description</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 text-sm whitespace-pre-wrap leading-relaxed text-slate-650 dark:text-slate-300">
              {lead.notes || 'No notes available.'}
            </div>
          </div>
        </div>

        {/* Side panel: Status History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Status Transitions
          </h3>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {lead.statusHistory?.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-xs py-8 text-center">
                No status changes recorded yet
              </div>
            ) : (
              lead.statusHistory?.map((hist) => (
                <div key={hist.id} className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-800 last:border-l-transparent pb-4 last:pb-0">
                  <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-500" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {hist.oldStatus} → {hist.newStatus}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Changed by: {hist.user?.name || 'System'}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {new Date(hist.changedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
