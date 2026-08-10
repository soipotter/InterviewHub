import React from 'react';
import { WeakTopicInfo } from '../types/progress';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export interface ProgressWeakTopicsProps {
  weakTopics: WeakTopicInfo[];
}

export const ProgressWeakTopics: React.FC<ProgressWeakTopicsProps> = ({ weakTopics }) => {
  return (
    <Card className="border-slate-800 bg-slate-900/60 text-left">
      <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white">Weak Domain Diagnostics</CardTitle>
        <Badge variant="warning" size="sm">
          Rule: &lt;70% Accuracy (min. 3 questions)
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-4">
        {weakTopics.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Alert variant="warning" title="Weak Domains Detected">
              The following domain categories fell below the 70% proficiency threshold with at least
              3 evaluated questions.
            </Alert>

            <div className="flex flex-col gap-2">
              {weakTopics.map((item) => (
                <div
                  key={item.category}
                  className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-950/20 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white">{item.category}</span>
                    <span className="text-xs text-amber-300 font-mono">
                      {item.correct}/{item.total} correct ({item.accuracy}%)
                    </span>
                  </div>
                  <Link to={`/questions?category=${item.category}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-amber-500/40 text-amber-300"
                    >
                      Practice {item.category} →
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="success" title="No Weak Domains Flagged">
            No weak domains detected! All evaluated categories met or exceeded the 70% proficiency
            threshold (or contained fewer than 3 attempted questions).
          </Alert>
        )}

        <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
          * Note: Weak domain detection evaluates categories with accuracy &lt;70% only when at
          least 3 questions have been completed to ensure statistical relevance.
        </p>
      </CardContent>
    </Card>
  );
};
