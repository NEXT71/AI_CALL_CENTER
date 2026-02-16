import { memo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatCard = memo(({ icon: Icon, label, value, change, changeType, color, loading }) => {
  if (loading) {
    return (
      <div className="kpi-card-enhanced animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-slate-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="kpi-card-enhanced group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-label-enhanced">{label}</p>
          <p className="kpi-value-enhanced">{value}</p>
          {change && (
            <div className={`kpi-change-enhanced flex items-center gap-1 mt-2 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-slate-600'
            }`}>
              {changeType === 'positive' ? <ArrowUp size={14} /> : 
               changeType === 'negative' ? <ArrowDown size={14} /> : null}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`kpi-icon-enhanced ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
