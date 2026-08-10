import React from 'react';
import { QuestionSource } from '../types/question';

export interface QuestionReferencesProps {
  sources?: QuestionSource[];
}

export const QuestionReferences: React.FC<QuestionReferencesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 text-left">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Authoritative References & Documentation
      </h3>
      <ul className="flex flex-col gap-2">
        {sources.map((src, idx) => (
          <li key={idx}>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
            >
              <span>{src.name}</span>
              <span className="text-[10px] text-slate-500 font-mono" aria-hidden="true">
                ↗ (External)
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
