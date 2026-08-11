import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { VozDiscoveryService, DiscoveredVozSource } from '../discovery/VozDiscoveryService';

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface IngestionRunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  status: 'completed' | 'failed';
  sourcesDiscovered: number;
  sourcesProcessed: number;
  pagesProcessed: number;
  postsProcessed: number;
  questionsFound: number;
  questionsInserted: number;
  duplicates: number;
  rejected: number;
  errors: number;
  discoveredSources: DiscoveredVozSource[];
  companyBreakdown: Record<string, number>;
}

export class VozSyncService {
  static async runSync(options?: { forceRescanThreadId?: string }): Promise<IngestionRunSummary> {
    const startedAt = new Date().toISOString();
    const runId = `run-${Date.now()}`;

    console.log('===========================================================');
    console.log(`VOZ INCREMENTAL SYNC STARTED (Run ID: ${runId})`);
    console.log('===========================================================');

    // Authenticate Admin
    await supabase.auth.signInWithPassword({
      email: 'gamecuasoine@gmail.com', password: '12345678',
    });

    // 1. Discover New Sources
    const discoveryResult = await VozDiscoveryService.discoverNewInterviewSources();
    const registeredSources = VozDiscoveryService.getRegisteredSources();

    console.log(`Discovered ${discoveryResult.newSourcesCount} new sources. Registered sources count: ${registeredSources.length}`);

    // Load existing DB records for composite key deduplication
    const existingDbRecords: Record<string, unknown>[] = [];
    const { data: dbData } = await supabase.from('ingested_questions').select('id, source_post_id, source_evidence_hash');
    if (dbData) existingDbRecords.push(...dbData);

    let pagesProcessed = 0;
    const postsProcessed = 0;
    const questionsFound = 0;
    const questionsInserted = 0;
    const duplicates = 0;
    const rejected = 0;
    let errors = 0;
    let sourcesProcessed = 0;

    const companyBreakdown: Record<string, number> = {};

    const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
    let browser;

    try {
      browser = await chromium.launch({ executablePath, headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      for (const src of registeredSources) {
        // Skip historical complete threads unless explicit rescan requested
        if (src.historicalComplete && options?.forceRescanThreadId !== src.threadId) {
          console.log(`[VozSync] Thread ${src.threadId} (${src.title}) is marked historicalComplete. Skipping ingestion.`);
          continue;
        }

        sourcesProcessed++;
        console.log(`[VozSync] Processing active source: ${src.canonicalUrl}...`);

        const startPage = src.lastProcessedPage > 0 ? src.lastProcessedPage + 1 : 1;
        const pageNum = startPage;

        try {
          const pageUrl = `${src.canonicalUrl}page-${pageNum}`;
          const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
          if (!response || response.status() !== 200) {
            console.log(`[VozSync] No new page available at ${pageUrl}. Source up to date.`);
            continue;
          }

          pagesProcessed++;
        } catch (err) {
          console.warn(`[VozSync] Error processing source ${src.threadId}:`, (err as Error).message);
          errors++;
        }
      }
    } catch (err) {
      console.error('[VozSync] Browser execution error:', (err as Error).message);
      errors++;
    } finally {
      if (browser) await browser.close();
    }

    const finishedAt = new Date().toISOString();

    const summary: IngestionRunSummary = {
      runId,
      startedAt,
      finishedAt,
      status: 'completed',
      sourcesDiscovered: discoveryResult.newSourcesCount,
      sourcesProcessed,
      pagesProcessed,
      postsProcessed,
      questionsFound,
      questionsInserted,
      duplicates,
      rejected,
      errors,
      discoveredSources: discoveryResult.discoveredThreads,
      companyBreakdown,
    };

    console.log('\n===========================================================');
    console.log('VOZ INCREMENTAL SYNC COMPLETED: SUMMARY REPORT');
    console.log('===========================================================');
    console.log(`Sources Discovered : ${summary.sourcesDiscovered}`);
    console.log(`Sources Processed  : ${summary.sourcesProcessed}`);
    console.log(`Pages Processed    : ${summary.pagesProcessed}`);
    console.log(`Questions Found    : ${summary.questionsFound}`);
    console.log(`Questions Inserted : ${summary.questionsInserted}`);
    console.log(`Duplicates         : ${summary.duplicates}`);
    console.log(`Errors             : ${summary.errors}`);
    console.log('===========================================================\n');

    return summary;
  }
}
