import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { Building2, Key, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@example.com',
      password: 'password123',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/40 dark:border-slate-800/60 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white mb-3 shadow-lg shadow-indigo-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold dark:text-slate-100">Welcome to Waanee CRM</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Sign in to manage your pipeline</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/10" 
            isLoading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Create account
          </Link>
        </div>

        {/* Interactive Credentials Helper Box */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/60 rounded-xl space-y-2.5">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
            Click to fill demo credentials
          </p>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <button 
              type="button"
              onClick={() => { reset({ email: 'admin@example.com', password: 'password123' }); toast.success('Loaded Admin credentials!'); }}
              className="flex items-center justify-between p-2 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-transparent hover:border-indigo-100/50 dark:hover:border-indigo-900/30 rounded-lg transition-all text-left w-full"
            >
              <span>🔑 <span className="font-bold text-purple-600 dark:text-purple-400">Admin:</span></span>
              <span className="font-mono text-slate-500 dark:text-slate-400">admin@example.com / password123</span>
            </button>
            <button 
              type="button"
              onClick={() => { reset({ email: 'manager@example.com', password: 'password123' }); toast.success('Loaded Manager credentials!'); }}
              className="flex items-center justify-between p-2 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-transparent hover:border-blue-100/50 dark:hover:border-blue-900/30 rounded-lg transition-all text-left w-full"
            >
              <span>🔑 <span className="font-bold text-blue-600 dark:text-blue-400">Manager:</span></span>
              <span className="font-mono text-slate-500 dark:text-slate-400">manager@example.com / password123</span>
            </button>
            <button 
              type="button"
              onClick={() => { reset({ email: 'agent@example.com', password: 'password123' }); toast.success('Loaded Agent credentials!'); }}
              className="flex items-center justify-between p-2 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-transparent hover:border-emerald-100/50 dark:hover:border-emerald-900/30 rounded-lg transition-all text-left w-full"
            >
              <span>🔑 <span className="font-bold text-emerald-650 dark:text-emerald-450">Agent:</span></span>
              <span className="font-mono text-slate-500 dark:text-slate-400">agent@example.com / password123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
