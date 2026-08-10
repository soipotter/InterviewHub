import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export const DashboardQuickActions: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-start gap-3 py-2">
      <Link to="/practice">
        <Button variant="primary" size="md">
          Start Practice →
        </Button>
      </Link>
      <Link to="/questions">
        <Button variant="outline" size="md">
          Browse Questions
        </Button>
      </Link>
      <Link to="/daily-challenge">
        <Button variant="secondary" size="md">
          Daily Challenge
        </Button>
      </Link>
      <Link to="/bookmarks">
        <Button variant="ghost" size="md" className="text-slate-300 hover:text-white">
          Review Bookmarks
        </Button>
      </Link>
    </div>
  );
};
