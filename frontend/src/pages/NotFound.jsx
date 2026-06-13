import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import Button from '../components/Button';

const NotFound = () => {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full mb-6">
        <HelpCircle className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-extrabold dark:text-slate-100 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" className="rounded-xl px-6">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
