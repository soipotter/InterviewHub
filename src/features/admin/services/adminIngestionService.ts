import { supabase } from '../../../services/supabase';
import { IngestedQuestion, IngestionStatus } from '../../question-ingestion/types/ingestion';

export const adminIngestionService = {
  /**
   * Fetches candidate-reported ingested questions directly from Supabase.
   */
  async getIngestedQuestions(filter?: {
    status?: IngestionStatus | 'all';
    duplicateOnly?: boolean;
  }): Promise<IngestedQuestion[]> {
    let query = supabase
      .from('ingested_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }
    if (filter?.duplicateOnly) {
      query = query.eq('is_duplicate_flagged', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[InterviewHub] Error fetching ingested_questions:', error);
      throw new Error(`Failed to load ingested questions from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      status: row.status,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      sourceType: row.source_type,
      sourcePublishedAt: row.source_published_at,
      originalText: row.original_text,
      normalizedQuestion: row.normalized_question,
      company: row.company,
      role: row.role,
      seniority: row.seniority,
      round: row.round,
      category: row.category,
      difficulty: row.difficulty,
      confidence: Number(row.confidence),
      isDuplicateFlagged: Boolean(row.is_duplicate_flagged),
      duplicateOfId: row.duplicate_of_id,
      similarityScore: row.similarity_score ? Number(row.similarity_score) : null,
      rejectionReason: row.rejection_reason,
      publishedQuestionId: row.published_question_id,
      moderatedBy: row.moderated_by,
      importedAt: row.imported_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sourceRequestedUrl: row.source_requested_url || row.source_url,
      sourceFinalUrl: row.source_final_url || row.source_url,
      sourcePageTitle: row.source_page_title || '',
      sourceEvidenceText: row.source_evidence_text || row.original_text,
      sourceEvidenceHash: row.source_evidence_hash || '',
      sourceFetchedAt: row.source_fetched_at || row.imported_at,
      sourceHttpStatus: row.source_http_status || 200,
      extractionClassification: row.extraction_classification || 'EXPLICIT_QUESTION',
      market: row.market || 'VN',
      location: row.location || null,
      locationEvidence: row.location_evidence || null,
      marketVerification: row.market_verification || 'verified',
      sourcePostId: row.source_post_id || null,
      sourcePage: row.source_page || null,
      questionDirection: row.question_direction || 'INTERVIEWER_TO_CANDIDATE',
      questionFormat: row.question_format || 'open_ended',
      sourceClassification: row.source_classification || 'actual_question',
      options: row.options || null,
      correctAnswer: row.correct_answer || null,
      modelAnswer: row.model_answer || null,
    }));
  },

  /**
   * Accepts an ingested question (review approval ONLY). Sets status = 'approved', publishedQuestionId remains NULL.
   * Does NOT insert into public.questions.
   */
  async acceptIngestedQuestion(
    questionId: string
  ): Promise<{ success: boolean }> {
    const { data, error } = await supabase.rpc('accept_ingested_question', {
      p_candidate_id: questionId,
    });

    if (error) {
      console.error('[InterviewHub] Error accepting ingested question:', error);
      throw new Error(`Failed to accept candidate question: ${error.message}`);
    }

    const res = data as { success: boolean };
    return { success: res.success };
  },

  /**
   * Publishes an accepted candidate question into public.questions via RPC.
   */
  async publishIngestedQuestion(
    questionId: string,
    editedMetadata?: Partial<IngestedQuestion>
  ): Promise<{ success: boolean; publishedQuestionId?: string }> {
    const { data, error } = await supabase.rpc('publish_ingested_question', {
      p_candidate_id: questionId,
      p_normalized_question: editedMetadata?.normalizedQuestion || null,
      p_company: editedMetadata?.company || null,
      p_role: editedMetadata?.role || null,
      p_category: editedMetadata?.category || null,
      p_difficulty: editedMetadata?.difficulty || null,
    });

    if (error) {
      console.error('[InterviewHub] Error publishing candidate question:', error);
      throw new Error(`Failed to publish candidate question: ${error.message}`);
    }

    const res = data as { success: boolean; published_question_id?: string };
    return {
      success: res.success,
      publishedQuestionId: res.published_question_id,
    };
  },

  /**
   * Deprecated atomic approve-and-publish call for backward compatibility.
   */
  async approveIngestedQuestion(
    questionId: string,
    editedMetadata?: Partial<IngestedQuestion>
  ): Promise<{ success: boolean; publishedQuestionId?: string }> {
    return this.publishIngestedQuestion(questionId, editedMetadata);
  },

  /**
   * Rejects an ingested candidate question with a reason using SECURITY DEFINER RPC.
   */
  async rejectIngestedQuestion(
    questionId: string,
    rejectionReason?: string
  ): Promise<{ success: boolean }> {
    const { error } = await supabase.rpc('reject_ingested_question', {
      p_candidate_id: questionId,
      p_reason: rejectionReason || 'Rejected by admin during curation',
    });

    if (error) {
      console.error('[InterviewHub] Error rejecting candidate question:', error);
      throw new Error(`Failed to reject question: ${error.message}`);
    }

    return { success: true };
  },

  /**
   * Bulk approves multiple candidate questions.
   */
  async bulkApprove(questionIds: string[]): Promise<{ approvedCount: number }> {
    let count = 0;
    for (const id of questionIds) {
      const res = await this.approveIngestedQuestion(id);
      if (res.success) count++;
    }
    return { approvedCount: count };
  },

  /**
   * Bulk rejects multiple candidate questions.
   */
  async bulkReject(
    questionIds: string[],
    rejectionReason: string
  ): Promise<{ rejectedCount: number }> {
    let count = 0;
    for (const id of questionIds) {
      const res = await this.rejectIngestedQuestion(id, rejectionReason);
      if (res.success) count++;
    }
    return { rejectedCount: count };
  },
};
