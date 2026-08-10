import React from 'react';
import { QuizAttemptResult } from '../types/practice';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';

export interface QuizWeakTopicsProps {
  result: QuizAttemptResult;
}

interface WeakTopicInfo {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
}

export const QuizWeakTopics: React.FC<QuizWeakTopicsProps> = ({ result }) => {
  const categoryMap = new Map<string, { correct: number; total: number }>();

  result.questionResults.forEach((q) => {
    const existing = categoryMap.get(q.category) || { correct: 0, total: 0 };
    existing.total += 1;
    if (q.isCorrect) existing.correct += 1;
    categoryMap.set(q.category, existing);
  });

  // Weak topic rule: accuracy < 70% AND total >= 3 questions in current evaluation set
  const weakTopics: WeakTopicInfo[] = [];

  categoryMap.forEach((data, category) => {
    const accuracy = Math.round((data.correct / data.total) * 100);
    if (data.total >= 3 && accuracy < 70) {
      weakTopics.push({
        category,
        correct: data.correct,
        total: data.total,
        accuracy,
      });
    }
  });

  return (
    <Card className="border-slate-800 bg-slate-900/60 text-left">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg text-white">Weak Topic Diagnostics</CardTitle>
          <Badge variant="warning" size="sm">
            Diagnostic Rule: &lt;70% Accuracy (min. 3 questions)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {weakTopics.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Alert variant="warning" title="Targeted Revision Recommended">
              The following domain topics were flagged because accuracy fell below the 70%
              proficiency threshold with at least 3 evaluated questions.
            </Alert>

            <div className="flex flex-col gap-2">
              {weakTopics.map((item) => (
                <div
                  key={item.category}
                  className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-950/20 flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white">{item.category}</span>
                    <span className="text-xs text-amber-300 font-mono">
                      Score: {item.correct}/{item.total} correct ({item.accuracy}%)
                    </span>
                  </div>
                  <Badge variant="warning" size="sm">
                    Weak Domain
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="success" title="No Weak Domains Flagged">
            Great job! All evaluated categories met or exceeded the 70% accuracy threshold (or
            contained fewer than 3 questions for a statistically significant sample).
          </Alert>
        )}

        <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
          * Note: Weak topic diagnostics use a strict 70% threshold applied when a minimum of 3
          questions per topic are attempted.
        </p>
      </CardContent>
    </Card>
  );
};
