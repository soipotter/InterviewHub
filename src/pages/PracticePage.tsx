import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { usePracticeBuilder } from '../features/practice/hooks/usePracticeBuilder';
import { PracticeBuilder } from '../features/practice/components/PracticeBuilder';

export const PracticePage: React.FC = () => {
  const builder = usePracticeBuilder();

  const headerNav = (
    <>
      <Link to="/questions" className="hover:text-white transition-colors font-medium">
        Questions
      </Link>
      <Link to="/practice" className="text-white font-bold border-b-2 border-indigo-500 pb-0.5">
        Practice
      </Link>
      <Link to="/daily-challenge" className="hover:text-white transition-colors font-medium">
        Daily Challenge
      </Link>
    </>
  );

  const headerActions = (
    <Link to="/login">
      <Button variant="outline" size="sm">
        Log In
      </Button>
    </Link>
  );

  return (
    <AppShell
      header={
        <Header navLinks={headerNav} userActions={headerActions} mobileNavLinks={headerNav} />
      }
      footer={<Footer />}
    >
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
            Frontend Practice & Quiz Engine
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
