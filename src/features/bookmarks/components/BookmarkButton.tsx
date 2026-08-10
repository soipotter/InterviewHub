import React from 'react';
import { useBookmark } from '../hooks/useBookmark';
import { Button } from '../../../components/ui/Button';

export interface BookmarkButtonProps {
  questionId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  questionId,
  size = 'sm',
  className,
}) => {
  const { isBookmarked, isLoading, toggleBookmark } = useBookmark(questionId);

  return (
    <Button
      type="button"
      variant={isBookmarked ? 'primary' : 'outline'}
      size={size}
      isLoading={isLoading}
      onClick={toggleBookmark}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Remove question from bookmarks' : 'Save question to bookmarks'}
      className={className}
    >
      {isBookmarked ? '★ Bookmarked' : '☆ Save'}
    </Button>
  );
};
