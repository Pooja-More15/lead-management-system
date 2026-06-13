import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { User } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().optional().or(z.literal('')),
});

const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password; // Ignore empty passwords

      await apiClient.put('/users/profile', payload);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-slate-100 flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-600" /> Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile details and update security settings.</p>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-xl shadow-sm p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="border-none">
            <Input
              label="Update Password (Optional)"
              type="password"
              placeholder="Leave blank to keep current password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
