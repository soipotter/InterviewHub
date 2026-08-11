import { IngestedQuestion, IngestionProvenance } from '../types/ingestion';

export const deduplicationService = {
  /**
   * Generates a normalized hash string for exact matching.
   */
  generateExactHash(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  },

  /**
   * Computes Jaccard Similarity (0.0 to 1.0) between two strings based on n-gram word tokens.
   */
  computeFuzzySimilarity(str1: string, str2: string): number {
    const clean1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const clean2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    const tokens1 = new Set(clean1.split(/\s+/).filter(Boolean));
    const tokens2 = new Set(clean2.split(/\s+/).filter(Boolean));

    if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
    if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const t of tokens1) {
      if (tokens2.has(t)) {
        intersectionCount++;
      }
    }

    const unionSize = new Set([...tokens1, ...tokens2]).size;
    return unionSize === 0 ? 0 : intersectionCount / unionSize;
  },

  /**
   * Checks a candidate question against existing ingested questions for exact and fuzzy duplicates.
   */
  detectDuplicates(
    candidate: IngestionProvenance,
    existingQuestions: IngestedQuestion[],
    fuzzyThreshold: number = 0.70
  ): { isDuplicate: boolean; duplicateOfId?: string; similarityScore?: number } {
    const candidateHash = this.generateExactHash(candidate.normalizedQuestion);

    for (const existing of existingQuestions) {
      const existingHash = this.generateExactHash(existing.normalizedQuestion);

      // Exact normalized text match
      if (candidateHash === existingHash) {
        return {
          isDuplicate: true,
          duplicateOfId: existing.id,
          similarityScore: 1.0,
        };
      }

      // Fuzzy match on normalized question text if company and role align
      const textSimilarity = this.computeFuzzySimilarity(
        candidate.normalizedQuestion,
        existing.normalizedQuestion
      );

      const isSameCompany =
        candidate.company.toLowerCase() === existing.company.toLowerCase();

      if (textSimilarity >= fuzzyThreshold || (isSameCompany && textSimilarity >= 0.60)) {
        return {
          isDuplicate: true,
          duplicateOfId: existing.id,
          similarityScore: Math.round(textSimilarity * 100) / 100,
        };
      }
    }

    return { isDuplicate: false };
  },
};
