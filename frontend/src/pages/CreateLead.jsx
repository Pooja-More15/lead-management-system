import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { ArrowLeft, Inbox, Sparkles } from 'lucide-react';
import axios from 'axios';

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number must be at least 5 digits'),
  source: z.string().min(2, 'Source must be at least 2 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  notes: z.string().optional(),
});

const CreateLead = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [populating, setPopulating] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      priority: 'MEDIUM',
      notes: '',
    }
  });

  const handleAutoFill = async () => {
    setPopulating(true);
    try {
      const res = await axios.get('https://randomuser.me/api/');
      const person = res.data.results[0];
      setValue('name', `${person.name.first} ${person.name.last}`);
      setValue('email', person.email);
      setValue('phone', person.phone);
      setValue('source', 'RandomUser API');
      toast.info('Form populated with random user data!');
    } catch (err) {
      toast.error('Failed to fetch random user data');
    } finally {
      setPopulating(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await apiClient.post('/leads', data);
      toast.success('Lead created and assigned successfully!');
      navigate('/leads');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link to="/leads" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold dark:text-slate-100 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-600" /> Create New Lead
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a new prospective contact and automatically assign them to sales agents.</p>
          </div>
          <Button
            type="button"
            onClick={handleAutoFill}
            variant="secondary"
            className="flex items-center gap-2 border-indigo-200 text-indigo-600 dark:text-indigo-400 font-semibold"
            isLoading={populating}
          >
            <Sparkles className="w-4 h-4" /> Auto-Fill Lead
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="Sarah Connor"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="sconnor@cyberdyne.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Phone Number"
              type="text"
              placeholder="+1 555-0199"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <div className="border-none">
              <Input
                label="Lead Source"
                type="text"
                placeholder="Website, Referral, LinkedIn..."
                error={errors.source?.message}
                {...register('source')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lead Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Description
            </label>
            <textarea
              placeholder="Describe requirements or follow up notes..."
              rows={4}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/leads">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={loading}>
              Create Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLead;
