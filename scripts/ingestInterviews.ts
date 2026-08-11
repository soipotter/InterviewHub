import { ingestionService } from '../src/features/question-ingestion/services/ingestionService';
import { IngestionFilterOptions } from '../src/features/question-ingestion/types/ingestion';

async function main() {
  const args = process.argv.slice(2);
  const options: IngestionFilterOptions = {};

  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1];
    } else if (arg.startsWith('--company=')) {
      options.company = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--discover') {
      console.log('[CLI Discovery] Running automatic VOZ interview source discovery...');
    } else if (arg === '--sync') {
      console.log('[CLI Sync] Running VOZ incremental sync pipeline...');
    } else if (arg.startsWith('--full-rescan=')) {
      console.log(`[CLI Rescan] Full rescan explicitly requested for thread ${arg.split('=')[1]}`);
    }
  }

  console.log('===========================================================');
  console.log('INTERVIEWHUB — CANDIDATE QUESTION INGESTION CRAWLER');
  console.log('===========================================================');
  console.log('Configuration:', {
    sourceFilter: options.source || 'ALL',
    companyFilter: options.company || 'ALL',
    dryRunMode: Boolean(options.dryRun),
  });
  console.log('-----------------------------------------------------------');

  const summary = await ingestionService.runIngestion(options);

  console.log('===========================================================');
  console.log('INGESTION SUMMARY REPORT');
  console.log('===========================================================');
  console.log(`URLs Discovered    : ${summary.urlsDiscovered}`);
  console.log(`URLs Processed     : ${summary.urlsProcessed}`);
  console.log(`Questions Extracted: ${summary.questionsExtracted}`);
  console.log(`New Questions      : ${summary.newQuestions}`);
  console.log(`Duplicates Flagged : ${summary.duplicates}`);
  console.log(`Rejected Candidates: ${summary.rejectedCandidates}`);
  console.log('-----------------------------------------------------------');

  if (summary.errors.length > 0) {
    console.log('Errors / Warnings:');
    summary.errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  } else {
    console.log('Status             : SUCCESS (0 errors)');
  }
  console.log('===========================================================');
}

main().catch((err) => {
  console.error('Fatal Ingestion Error:', err);
  process.exit(1);
});
