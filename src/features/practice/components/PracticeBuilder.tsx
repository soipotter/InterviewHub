import React from 'react';
import { Category, Difficulty, QuestionType } from '../../questions/types/question';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface PracticeBuilderProps {
  category: Category | 'All';
  setCategory: (val: Category | 'All') => void;
  difficulty: Difficulty | 'All';
  setDifficulty: (val: Difficulty | 'All') => void;
  type: QuestionType | 'All';
  setType: (val: QuestionType | 'All') => void;
  requestedCount: number;
  setRequestedCount: (count: number) => void;
  availableCount: number;
  actualCount: number;
  isValidConfig: boolean;
  onStartQuiz: () => void;
}

const CATEGORY_OPTIONS: Array<{ value: Category | 'All'; label: string }> = [
  { value: 'All', label: 'All Categories (Mixed)' },
  { value: 'HTML', label: 'HTML & Accessibility' },
  { value: 'CSS', label: 'CSS Layouts' },
  { value: 'JavaScript', label: 'JavaScript (ES6+)' },
  { value: 'React', label: 'React Framework' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Web Fundamentals', label: 'Web Fundamentals' },
  { value: 'Git', label: 'Git & Version Control' },
];

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty | 'All'; label: string }> = [
  { value: 'All', label: 'All Difficulties' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Intermediate', label: 'Intermediate' },
];

const TYPE_OPTIONS: Array<{ value: QuestionType | 'All'; label: string }> = [
  { value: 'All', label: 'All Question Types' },
  { value: 'Multiple Choice', label: 'Multiple Choice' },
  { value: 'True/False', label: 'True / False' },
];

const COUNT_OPTIONS = [
  { value: 5, label: '5 Questions (Quick Check)' },
  { value: 10, label: '10 Questions (Standard Quiz)' },
  { value: 15, label: '15 Questions (Full Drill)' },
];

export const PracticeBuilder: React.FC<PracticeBuilderProps> = ({
  category,
  setCategory,
  difficulty,
  setDifficulty,
  type,
  setType,
  requestedCount,
  setRequestedCount,
  availableCount,
  actualCount,
  isValidConfig,
  onStartQuiz,
}) => {
  return (
    <Card className="border-slate-800 bg-slate-950/80 shadow-2xl">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="default" size="sm">
            Interactive Quiz Generator
          </Badge>
          <span className="text-xs font-mono text-slate-400">
            {availableCount} {availableCount === 1 ? 'question' : 'questions'} available
          </span>
        </div>
        <CardTitle className="text-xl text-white">Configure Your Practice Session</CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Customize your quiz parameters to target weak topics or simulate an interview domain test.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Category Domain"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'All')}
            options={CATEGORY_OPTIONS}
          />
          <Select
            label="Target Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | 'All')}
            options={DIFFICULTY_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Question Format"
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType | 'All')}
            options={TYPE_OPTIONS}
          />
          <Select
            label="Question Count"
            value={requestedCount}
            onChange={(e) => setRequestedCount(parseInt(e.target.value, 10))}
            options={COUNT_OPTIONS.map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            }))}
          />
        </div>

        {/* Available questions notification banner */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">
            Matching Questions: <strong className="text-indigo-400">{availableCount}</strong>
          </span>
          {availableCount > 0 ? (
            <span className="text-emerald-400">✓ Ready ({actualCount} selected)</span>
          ) : (
            <span className="text-rose-400">✕ No matching questions available</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-800/80 pt-4 flex justify-end">
        <Button
          variant="primary"
          size="lg"
          disabled={!isValidConfig}
          onClick={onStartQuiz}
          className="w-full sm:w-auto font-semibold"
        >
          Start Practice ({actualCount} Qs) →
        </Button>
      </CardFooter>
    </Card>
  );
};
