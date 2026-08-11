// CLI Verification Runner for Ingestion System

const { VozSource } = require('./src/features/question-ingestion/sources/VozSource.ts');
const { RedditSource } = require('./src/features/question-ingestion/sources/RedditSource.ts');
const { GenericArticleSource } = require('./src/features/question-ingestion/sources/GenericArticleSource.ts');
const { extractionService } = require('./src/features/question-ingestion/services/extractionService.ts');
const { deduplicationService } = require('./src/features/question-ingestion/services/deduplicationService.ts');

async function testCliIngestion() {
  console.log('===========================================================');
  console.log('INTERVIEWHUB — CANDIDATE QUESTION INGESTION CRAWLER (DRY-RUN)');
  console.log('===========================================================');

  const voz = new VozSource();
  const reddit = new RedditSource();
  const blog = new GenericArticleSource();

  const posts = [
    ...(await voz.discoverPosts({ limit: 5 })),
    ...(await reddit.discoverPosts({ limit: 5 })),
    ...(await blog.discoverPosts({ limit: 5 })),
  ];

  console.log(`Discovered ${posts.length} candidate interview experience pages.`);

  const storedQuestions = [];
  let extractedCount = 0;
  let newCount = 0;
  let dupCount = 0;

  for (const post of posts) {
    const provenanceList = extractionService.extractQuestionsFromPost(post);
    extractedCount += provenanceList.length;

    for (const prov of provenanceList) {
      const dupCheck = deduplicationService.detectDuplicates(prov, storedQuestions);
      if (dupCheck.isDuplicate) {
        dupCount++;
      } else {
        newCount++;
      }
      storedQuestions.push({
        id: `ingest-test-${storedQuestions.length + 1}`,
        ...prov,
        status: 'pending_review',
        isDuplicateFlagged: dupCheck.isDuplicate,
      });
    }
  }

  console.log('-----------------------------------------------------------');
  console.log(`URLs Discovered    : ${posts.length}`);
  console.log(`URLs Processed     : ${posts.length}`);
  console.log(`Questions Extracted: ${extractedCount}`);
  console.log(`New Questions      : ${newCount}`);
  console.log(`Duplicates Flagged : ${dupCount}`);
  console.log('-----------------------------------------------------------');
  console.log('Sample Extracted Provenance Record:');
  console.log(JSON.stringify(storedQuestions[0], null, 2));
  console.log('===========================================================');
}

testCliIngestion();
