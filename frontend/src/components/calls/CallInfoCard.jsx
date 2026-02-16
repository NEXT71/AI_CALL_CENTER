import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';

const CallInfoCard = ({ call }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Information</CardTitle>
        <CardDescription>Basic details about this call</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Call ID" value={call.callId} />
          <InfoItem label="Agent" value={call.agentName} />
          <InfoItem label="Customer" value={call.customerName} />
          <InfoItem label="Campaign" value={call.campaign} />
          <InfoItem 
            label="Date" 
            value={new Date(call.callDate).toLocaleDateString()} 
          />
          <InfoItem 
            label="Duration" 
            value={`${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}`} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
    <p className="font-medium text-slate-900">{value}</p>
  </div>
);

export default CallInfoCard;
