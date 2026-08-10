import React from 'react';
import { QuizAttemptResult } from '../types/practice';
import { QuizResultQuestion } from './QuizResultQuestion';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

export interface QuizResultReviewProps {
  result: QuizAttemptResult;
}

export const QuizResultReview: React.FC<QuizResultReviewProps> = ({ result }) => {
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader className="pb-3 border-b border-slate-800/60 text-left">
        <CardTitle className="text-xl text-white">Question-by-Question Review</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-6">
        {result.questionResults.map((item, idx) => (
          <QuizResultQuestion key={item.questionId} index={idx} item={item} />
        ))}
      </CardContent>
    </Card>
  );
};
