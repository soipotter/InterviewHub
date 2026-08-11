import { RawCandidatePost, SourceType } from '../types/ingestion';

export interface IngestionSourceAdapter {
  name: string;
  type: SourceType;
  baseUrl: string;
  discoverPosts(options?: { company?: string; limit?: number }): Promise<RawCandidatePost[]>;
  validateUrl(url: string): boolean;
}

export abstract class BaseSourceAdapter implements IngestionSourceAdapter {
  abstract name: string;
  abstract type: SourceType;
  abstract baseUrl: string;

  /**
   * Keywords prioritized for finding Vietnamese IT candidate interview experiences.
   */
  protected readonly discoveryKeywords = [
    'phỏng vấn',
    'review phỏng vấn',
    'kinh nghiệm phỏng vấn',
    'interview experience',
    'technical interview',
    'coding test',
    'fresher interview',
    'intern interview',
  ];

  abstract discoverPosts(options?: { company?: string; limit?: number }): Promise<RawCandidatePost[]>;

  validateUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
