import React from 'react';

const Input = React.forwardRef(({ label, type = 'text', error, placeholder, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all dark:text-slate-100 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
