export type SourceType = 'forum' | 'reddit' | 'blog' | 'generic_article';

export type SeniorityLevel = 'Intern' | 'Fresher' | 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Unknown';

export type IngestionStatus = 'pending_review' | 'approved' | 'rejected';

export type ExtractionClassification = 'EXPLICIT_QUESTION' | 'SPECIFIC_PROMPT' | 'TOPIC_ONLY' | 'UNSUPPORTED';

export interface IngestionProvenance {
  sourceName: string;
  sourceUrl: string;
  sourceRequestedUrl: string;
  sourceFinalUrl: string;
  sourceType: SourceType;
  sourcePageTitle: string;
  sourceEvidenceText: string;
  sourceEvidenceHash?: string | null;
  sourceFetchedAt: string;
  sourceHttpStatus: number;
  sourcePostId?: string | null;
  sourcePage?: number | null;
  sourcePublishedAt?: string | null;
  originalText: string;
  normalizedQuestion: string;
  extractionClassification: ExtractionClassification;
  company: string;
  role: string;
  market: 'VN';
  location?: string | null;
  locationEvidence?: string | null;
  marketVerification: 'verified' | 'uncertain';
  seniority: SeniorityLevel;
  round?: string | null;
  category: string;
  difficulty: 'Beginner' | 'Junior' | 'Intermediate' | 'Advanced';
  confidence: number; // 0.0 to 1.0
  importedAt: string;
}

export interface IngestedQuestion extends IngestionProvenance {
  id: string;
  status: IngestionStatus;
  isDuplicateFlagged: boolean;
  duplicateOfId?: string | null;
  similarityScore?: number | null;
  rejectionReason?: string | null;
  publishedQuestionId?: string | null;
  moderatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawCandidatePost {
  title: string;
  content: string;
  url: string;
  sourceName: string;
  sourceType: SourceType;
  publishedAt?: string | null;
  companyHint?: string;
  roleHint?: string;
}

export interface IngestionFilterOptions {
  source?: string;
  company?: string;
  dryRun?: boolean;
  limit?: number;
}

export interface IngestionRunSummary {
  urlsDiscovered: number;
  urlsProcessed: number;
  questionsExtracted: number;
  newQuestions: number;
  duplicates: number;
  rejectedCandidates: number;
  errors: string[];
}
