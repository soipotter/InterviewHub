import crypto from 'crypto';
import { IngestedQuestion } from '../types/ingestion';

export interface ProvenanceValidationResult {
  isValid: boolean;
  rejectionReason?: string | null;
  evidenceHash?: string;
}

export function computeRealSha256Hash(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function validateProvenanceRecord(
  record: Partial<IngestedQuestion> & {
    sourceSectionId?: string;
    sourceEvidenceRaw?: string;
    evidenceStartOffset?: number;
    evidenceEndOffset?: number;
    evidenceHash?: string;
    questionDirection?: string;
  },
  sectionText: string
): ProvenanceValidationResult {
  // 1. Source post exists
  if (!record.sourcePostId) {
    return { isValid: false, rejectionReason: 'REJECT_MISSING_POST_ID' };
  }

  // 2. Source section exists
  if (!record.sourceSectionId) {
    return { isValid: false, rejectionReason: 'REJECT_MISSING_SECTION_ID' };
  }

  // 3. Company metadata belongs to section
  if (!record.company || record.company.trim() === '' || record.company === 'NULL (Unstated)') {
    return { isValid: false, rejectionReason: 'REJECT_MISSING_COMPANY' };
  }

  // 4 & 5. Raw evidence and offset string matching
  const rawText = record.sourceEvidenceRaw || record.sourceEvidenceText;
  if (!rawText) {
    return { isValid: false, rejectionReason: 'REJECT_MISSING_RAW_EVIDENCE' };
  }

  const start = record.evidenceStartOffset ?? 0;
  const end = record.evidenceEndOffset ?? sectionText.length;

  if (start < 0 || end > sectionText.length || start > end) {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_OFFSETS' };
  }

  const slicedText = sectionText.substring(start, end);
  const normSliced = slicedText.replace(/\s+/g, ' ').trim().toLowerCase();
  const normRaw = rawText.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normSliced !== normRaw) {
    return { isValid: false, rejectionReason: 'REJECT_EVIDENCE_OFFSET_MISMATCH' };
  }

  // 6. Cryptographic SHA-256 Validation
  const expectedHash = computeRealSha256Hash(rawText);

  if (!/^[0-9a-f]{64}$/.test(expectedHash)) {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_SHA256_FORMAT' };
  }

  if (record.evidenceHash) {
    if (!/^[0-9a-f]{64}$/.test(record.evidenceHash)) {
      return { isValid: false, rejectionReason: 'REJECT_FAKE_OR_INVALID_HASH_FORMAT' };
    }
    if (record.evidenceHash !== expectedHash) {
      return { isValid: false, rejectionReason: 'REJECT_HASH_MISMATCH' };
    }
  }

  // 7. Direction check
  if (record.questionDirection && record.questionDirection !== 'INTERVIEWER_TO_CANDIDATE') {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_DIRECTION' };
  }

  // 8. Classification check
  if (record.extractionClassification === 'TOPIC_ONLY' || record.extractionClassification === 'UNSUPPORTED') {
    return { isValid: false, rejectionReason: 'REJECT_TOPIC_ONLY' };
  }

  // 9. Topic false-positive filter
  const lowerRaw = rawText.toLowerCase().trim();
  if (
    lowerRaw === 'event loop' ||
    lowerRaw === 'cơ chế fallover của redis-cluster' ||
    lowerRaw === 'system design movie-ticket system' ||
    lowerRaw.includes('các câu hỏi về javascript') ||
    lowerRaw.includes('behavioral interview') ||
    lowerRaw.includes('những câu lí thuyết về js')
  ) {
    return { isValid: false, rejectionReason: 'REJECT_TOPIC_FALSE_POSITIVE' };
  }

  // 10. Canonical URL format check
  if (!record.sourceFinalUrl || !record.sourceFinalUrl.includes('/post-')) {
    return { isValid: false, rejectionReason: 'REJECT_NON_CANONICAL_URL' };
  }

  return {
    isValid: true,
    evidenceHash: expectedHash,
  };
}
