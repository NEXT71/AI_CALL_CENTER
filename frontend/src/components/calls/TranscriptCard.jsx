import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const TranscriptCard = ({ transcript }) => {
  if (!transcript) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-slate-500">
          No transcript available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {transcript}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptCard;
