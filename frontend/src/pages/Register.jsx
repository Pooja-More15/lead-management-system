import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { Building2, Key, Mail, User } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
      'Password must contain 1 uppercase, 1 lowercase, and 1 number'
    ),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT']),
});

const Register = () => {
  const { register: signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'AGENT',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup(data.name, data.email, data.password, data.role);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/40 dark:border-slate-800/60 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white mb-3 shadow-lg shadow-indigo-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold dark:text-slate-100">Create Account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get started with Waanee CRM</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Full Name"
              type="text"
              placeholder="Alice Vance"
              error={errors.name?.message}
              {...register('name')}
              className="pl-10"
            />
            <User className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="relative">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
              className="pl-10"
            />
            <Mail className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="relative border-none">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
              className="pl-10"
            />
            <Key className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Role
            </label>
            <select
              {...register('role')}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-slate-100"
            >
              <option value="AGENT">AGENT (Sales Staff)</option>
              <option value="MANAGER">MANAGER (Lead Creator)</option>
              <option value="ADMIN">ADMIN (System Administrator)</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.role.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/10 mt-2" 
            isLoading={loading}
          >
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <span>Already have an account? </span>
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
