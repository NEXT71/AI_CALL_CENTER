import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ScoreCard = ({ label, score, icon: Icon, color }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {Icon && <Icon className={color} size={20} />}
      </div>
      <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
        {score}%
      </p>
    </div>
  );
};

const QualityScoresCard = ({ scores }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {scores.quality && (
            <ScoreCard 
              label="Quality Score" 
              score={scores.quality} 
              icon={CheckCircle}
              color="text-blue-600"
            />
          )}
          {scores.compliance !== undefined && (
            <ScoreCard 
              label="Compliance" 
              score={scores.compliance} 
              icon={scores.compliance >= 80 ? CheckCircle : XCircle}
              color={scores.compliance >= 80 ? 'text-green-600' : 'text-red-600'}
            />
          )}
          {scores.sentiment && (
            <ScoreCard 
              label="Sentiment" 
              score={scores.sentiment} 
              icon={AlertTriangle}
              color="text-purple-600"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityScoresCard;
