const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  return (
    <div className={`
      ${sizes[size]}
      border-blue-200 border-t-blue-600 rounded-full animate-spin
      ${className}
    `} />
  );
};

export const LoadingSpinner = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Spinner size="lg" />
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  );
};

export default Spinner;
