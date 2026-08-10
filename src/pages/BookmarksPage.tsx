import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { useBookmarks } from '../features/bookmarks/hooks/useBookmarks';
import { BookmarkList } from '../features/bookmarks/components/BookmarkList';

export const BookmarksPage: React.FC = () => {
  const { bookmarkedQuestions, isLoading, removeBookmark } = useBookmarks();

  return (
    <AppShell header={<Header />} footer={<Footer />}>
      <div className="flex flex-col gap-6 text-left pb-16 max-w-6xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Badge variant="default" size="md">
              Revision Bookmarks
            </Badge>
            <span className="text-xs font-mono text-slate-400">
              {bookmarkedQuestions.length}{' '}
              {bookmarkedQuestions.length === 1 ? 'saved question' : 'saved questions'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Bookmarked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Your personal collection of saved technical interview questions for targeted review and
            revision.
          </p>
        </div>

        {/* Bookmark List Grid */}
        <BookmarkList
          questions={bookmarkedQuestions}
          isLoading={isLoading}
          onRemove={removeBookmark}
        />
      </div>
    </AppShell>
  );
};

export default BookmarksPage;
