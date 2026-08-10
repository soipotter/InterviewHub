import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';

export interface QuestionSearchProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const QuestionSearch: React.FC<QuestionSearchProps> = ({
  value = '',
  onSearch,
  placeholder = 'Search by question title, summary, topic, or #tag...',
}) => {
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync internal state if URL search query changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounce search update to URL query params
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== value) {
        onSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, value, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative w-full">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        leftAddon={<span className="text-slate-400">🔍</span>}
        rightAddon={
          searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-white p-1 rounded focus:outline-none cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null
        }
      />
    </div>
  );
};
