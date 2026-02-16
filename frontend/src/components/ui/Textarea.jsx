import { forwardRef } from 'react';

const Textarea = forwardRef(({ 
  label, 
  error, 
  helperText,
  rows = 4,
  maxLength,
  showCount = false,
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-3 py-2 border rounded-lg transition-colors resize-y
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}
          ${className}
        `}
        {...props}
      />
      <div className="flex items-center justify-between mt-1">
        <div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-sm text-slate-500">{helperText}</p>
          )}
        </div>
        {showCount && maxLength && (
          <p className="text-xs text-slate-400">
            {(props.value || '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
