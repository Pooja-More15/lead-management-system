import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { ArrowLeft, Edit2 } from 'lucide-react';

const editLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number must be at least 5 digits'),
  source: z.string().min(2, 'Source must be at least 2 characters'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  notes: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional().or(z.literal('')),
});

const EditLead = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agents, setAgents] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editLeadSchema),
  });

  // Fetch lead data and active agents
  useEffect(() => {
    const initData = async () => {
      try {
        const leadRes = await apiClient.get(`/leads/${id}`);
        const lead = leadRes.data.data;
        
        reset({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          priority: lead.priority,
          notes: lead.notes || '',
          assignedTo: lead.assignedTo || '',
        });

        if (hasPermission('assign_leads')) {
          const agentsRes = await apiClient.get('/users/agents');
          setAgents(agentsRes.data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load lead details');
        navigate('/leads');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, reset, hasPermission, navigate, toast]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let payload;
      if (user?.role === 'AGENT') {
        payload = {
          status: data.status,
          notes: data.notes,
        };
      } else {
        payload = {
          ...data,
          assignedTo: data.assignedTo === '' ? null : data.assignedTo,
        };
      }
      await apiClient.put(`/leads/${id}`, payload);
      toast.success('Lead updated successfully!');
      navigate(`/leads/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link to={`/leads/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Details
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold dark:text-slate-100 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-amber-500" /> Edit Lead Details
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Modify status, update notes, or reassign this lead to sales agents.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Full Name"
              type="text"
              error={errors.name?.message}
              readOnly={user?.role === 'AGENT'}
              className={user?.role === 'AGENT' ? 'opacity-70 bg-slate-50 dark:bg-slate-950 cursor-not-allowed' : ''}
              {...register('name')}
            />
            <Input
              label="Email Address"
              type="email"
              error={errors.email?.message}
              readOnly={user?.role === 'AGENT'}
              className={user?.role === 'AGENT' ? 'opacity-70 bg-slate-50 dark:bg-slate-950 cursor-not-allowed' : ''}
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Phone Number"
              type="text"
              error={errors.phone?.message}
              readOnly={user?.role === 'AGENT'}
              className={user?.role === 'AGENT' ? 'opacity-70 bg-slate-50 dark:bg-slate-950 cursor-not-allowed' : ''}
              {...register('phone')}
            />
            <div className="border-none">
              <Input
                label="Lead Source"
                type="text"
                error={errors.source?.message}
                readOnly={user?.role === 'AGENT'}
                className={user?.role === 'AGENT' ? 'opacity-70 bg-slate-50 dark:bg-slate-950 cursor-not-allowed' : ''}
                {...register('source')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lead Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="LOST">LOST</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lead Priority
              </label>
              <select
                {...register('priority')}
                disabled={user?.role === 'AGENT'}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {hasPermission('assign_leads') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Agent
                </label>
                <select
                  {...register('assignedTo')}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Description
            </label>
            <textarea
              rows={5}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to={`/leads/${id}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLead;
