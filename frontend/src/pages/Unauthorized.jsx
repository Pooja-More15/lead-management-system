import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/Button';

const Unauthorized = () => {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full mb-6">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-extrabold dark:text-slate-100 mb-2">Access Denied</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        You do not have the required role permissions to access this administrative page. Please contact your administrator.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" className="rounded-xl px-6">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default Unauthorized;
