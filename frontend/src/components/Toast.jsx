import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-slide-in-right`}>
      <div className={`${styles[type]} border-2 rounded-2xl shadow-2xl p-5 flex items-start justify-between backdrop-blur-xl bg-white/95`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-2 rounded-xl ${
            type === 'success' ? 'bg-green-100' :
            type === 'error' ? 'bg-red-100' :
            type === 'warning' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            {icons[type]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-relaxed text-slate-900">{message}</p>
            <div className={`mt-2 h-1 bg-gradient-to-r rounded-full ${
              type === 'success' ? 'from-green-400 to-green-600' :
              type === 'error' ? 'from-red-400 to-red-600' :
              type === 'warning' ? 'from-yellow-400 to-yellow-600' :
              'from-blue-400 to-blue-600'
            }`} style={{ width: '100%', animation: 'progress 3s linear' }}></div>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
            type === 'success' ? 'hover:bg-green-50 text-green-600' :
            type === 'error' ? 'hover:bg-red-50 text-red-600' :
            type === 'warning' ? 'hover:bg-yellow-50 text-yellow-600' :
            'hover:bg-blue-50 text-blue-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
