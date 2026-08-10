// Global type definitions for InterviewHub

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
