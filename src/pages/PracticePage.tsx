import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { usePracticeBuilder } from '../features/practice/hooks/usePracticeBuilder';
import { PracticeBuilder } from '../features/practice/components/PracticeBuilder';

export const PracticePage: React.FC = () => {
  const builder = usePracticeBuilder();

  return (
    <AppShell>
      <div className="flex flex-col gap-8 text-left pb-16">
        {/* Page Header */}
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Badge variant="default" size="md">
              Practice Mode
            </Badge>
            <span className="text-xs font-mono text-slate-400">Interactive Quiz Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frontend Practice &amp; Quiz Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Test your knowledge under quiz conditions. Select target domains, difficulty levels, and
            question format to generate a custom practice session.
          </p>
        </div>

        {/* Practice Builder Card */}
        <PracticeBuilder
          category={builder.category}
          setCategory={builder.setCategory}
          difficulty={builder.difficulty}
          setDifficulty={builder.setDifficulty}
          type={builder.type}
          setType={builder.setType}
          requestedCount={builder.requestedCount}
          setRequestedCount={builder.setRequestedCount}
          availableCount={builder.availableCount}
          actualCount={builder.actualCount}
          isValidConfig={builder.isValidConfig}
          onStartQuiz={builder.startQuiz}
        />
      </div>
    </AppShell>
  );
};

export default PracticePage;
