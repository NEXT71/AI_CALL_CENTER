import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

const RecentCallRow = memo(({ call, formatDate, getScoreBadge }) => (
  <tr>
    <td className="px-6 py-4">
      <div className="font-medium text-cool-white">{call.agentName || 'Unknown'}</div>
      <div className="text-xs text-cool-white/60">{call.campaign || 'N/A'}</div>
    </td>
    <td className="px-6 py-4 text-cool-white/80">{formatDate(call.callDate)}</td>
    <td className="px-6 py-4">
      <span className={`badge-compact ${getScoreBadge(call.qualityScore)}`}>
        {call.qualityScore ? `${call.qualityScore}%` : 'N/A'}
      </span>
    </td>
    <td className="px-6 py-4">
      <Link 
        to={`/app/calls/${call._id}`} 
        className="text-electric-blue hover:text-electric-blue-light inline-flex items-center gap-1 transition-colors"
      >
        <Eye size={16} />
        View
      </Link>
    </td>
  </tr>
));

RecentCallRow.displayName = 'RecentCallRow';

export default RecentCallRow;
