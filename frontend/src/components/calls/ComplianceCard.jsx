import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { CheckCircle, XCircle } from 'lucide-react';

const ComplianceCard = ({ violations }) => {
  if (!violations || violations.length === 0) {
    return (
      <Card className="border-green-200">
        <CardContent className="flex items-center justify-center gap-3 py-8">
          <CheckCircle className="text-green-600" size={24} />
          <p className="text-green-700 font-medium">No compliance violations found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compliance Violations</CardTitle>
          <Badge variant="danger">{violations.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {violations.map((violation, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
            >
              <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-medium text-red-900">{violation.rule}</p>
                <p className="text-sm text-red-700 mt-1">{violation.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceCard;
