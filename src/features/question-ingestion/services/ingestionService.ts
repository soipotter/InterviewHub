import { supabase } from '../../../services/supabase';
import { VozSource } from '../sources/VozSource';
import { BaseSourceAdapter } from '../sources/baseSource';
import { extractionService } from './extractionService';
import { deduplicationService } from './deduplicationService';
import {
  IngestedQuestion,
  IngestionFilterOptions,
  IngestionRunSummary,
  RawCandidatePost,
} from '../types/ingestion';

let lastCrawledAtTimestamp: string | null = null;

export const ingestionService = {
  getAdapters(): BaseSourceAdapter[] {
    // Only VozSource is active for real collection in Phase 2
    return [new VozSource()];
  },

  getLastCrawledAt(): string | null {
    return lastCrawledAtTimestamp;
  },

  /**
   * Fetches existing ingested questions directly from Supabase.
   */
  async getExistingIngestedQuestions(): Promise<IngestedQuestion[]> {
    const { data, error } = await supabase
      .from('ingested_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[InterviewHub Ingestion] Error fetching ingested questions:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return (data as unknown as IngestedQuestion[]) || [];
  },

  /**
   * Executes real candidate question ingestion pipeline across Voz source adapter and inserts into Supabase.
   */
  async runIngestion(options: IngestionFilterOptions = {}): Promise<IngestionRunSummary> {
    const summary: IngestionRunSummary = {
      urlsDiscovered: 0,
      urlsProcessed: 0,
      questionsExtracted: 0,
      newQuestions: 0,
      duplicates: 0,
      rejectedCandidates: 0,
      errors: [],
    };

    const adapters = this.getAdapters();
    const discoveredPosts: RawCandidatePost[] = [];

    for (const adapter of adapters) {
      try {
        const posts = await adapter.discoverPosts({
          company: options.company,
          limit: options.limit || 10,
        });
        discoveredPosts.push(...posts);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.errors.push(`[${adapter.name}] Discovery failed: ${msg}`);
      }
    }

    summary.urlsDiscovered = discoveredPosts.length;

    // Fetch existing records from Supabase to check duplicates
    let existingRecords: IngestedQuestion[] = [];
    try {
      existingRecords = await this.getExistingIngestedQuestions();
    } catch {
      existingRecords = [];
    }

    for (const post of discoveredPosts) {
      summary.urlsProcessed++;
      try {
        const extractedProvenance = extractionService.extractQuestionsFromPost(post);
        summary.questionsExtracted += extractedProvenance.length;

        for (const prov of extractedProvenance) {
          const dupResult = deduplicationService.detectDuplicates(
            prov,
            existingRecords
          );

          if (dupResult.isDuplicate) {
            summary.duplicates++;
          } else {
            summary.newQuestions++;
          }

          if (!options.dryRun) {
            const dbRecord = {
              status: 'pending_review',
              source_name: prov.sourceName,
              source_url: prov.sourceUrl,
              source_type: prov.sourceType,
              source_published_at: prov.sourcePublishedAt || null,
              original_text: prov.originalText,
              normalized_question: prov.normalizedQuestion,
              company: prov.company,
              role: prov.role,
              seniority: prov.seniority,
              round: prov.round || null,
              category: prov.category,
              difficulty: prov.difficulty,
              confidence: prov.confidence,
              is_duplicate_flagged: dupResult.isDuplicate,
              duplicate_of_id: dupResult.duplicateOfId || null,
              similarity_score: dupResult.similarityScore || null,
              imported_at: prov.importedAt,
            };

            const { data: inserted, error: insertError } = await supabase
              .from('ingested_questions')
              .insert([dbRecord])
              .select();

            if (insertError) {
              summary.errors.push(`Database insert failed for ${prov.normalizedQuestion}: ${insertError.message}`);
            } else if (inserted && inserted.length > 0) {
              existingRecords.push(inserted[0] as unknown as IngestedQuestion);
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.rejectedCandidates++;
        summary.errors.push(`Failed to process URL ${post.url}: ${msg}`);
      }
    }

    lastCrawledAtTimestamp = new Date().toISOString();
    return summary;
  },
};
