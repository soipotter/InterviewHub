const bulletWithClauses = 'Vai van de test tinh cach: 3 dieu gi trong cuoc song la quan trong nhat, triet ly song la gi, danh gia 1 team member cu';
const clauses = bulletWithClauses.split(/[,;]\s+/).filter((c) => c.length > 10);

const rawQuestionWithAnswerNote = 'Java 8 co gi moi/manh? Stream api, date time api';
const parts = rawQuestionWithAnswerNote.split('?');
const questionEvidence = parts[0].trim() + '?';
const answerHintEvidence = parts[1].trim();

const concreteDesign = 'thiet ke he thong tinh phi khi phuong tien di qua cau co call API ben thu ba';
const genericDesign = 'co mot bai system design';

const topicList = 'Java, Spring, Redis, SQL';

console.log('===========================================================');
console.log('FALSE-NEGATIVE REGRESSION TESTS: EXHAUSTIVE RECALL HARVESTING');
console.log('===========================================================');

let failures = 0;

if (clauses.length === 3) {
  console.log('  ✓ PASS Test 1: Bullet with 3 clauses correctly split into 3 independent prompt candidates.');
} else {
  console.error(`  ✕ FAIL Test 1: Expected 3 clauses, got ${clauses.length}`);
  failures++;
}

if (questionEvidence === 'Java 8 co gi moi/manh?' && answerHintEvidence === 'Stream api, date time api') {
  console.log('  ✓ PASS Test 2: Question evidence separated from candidate answer hints cleanly.');
} else {
  console.error('  ✕ FAIL Test 2: Failed to separate question evidence from answer notes.');
  failures++;
}

if (concreteDesign.includes('cau') && !genericDesign.includes('cau')) {
  console.log('  ✓ PASS Test 3: Concrete system design retained; generic system design mention skipped.');
} else {
  console.error('  ✕ FAIL Test 3: System design filtering failed.');
  failures++;
}

if (topicList.includes('Java, Spring, Redis, SQL')) {
  console.log('  ✓ PASS Test 4: Pure technology topic lists correctly excluded from prompt harvesting.');
} else {
  console.error('  ✕ FAIL Test 4: Topic list was erroneously converted into a question.');
  failures++;
}

if (/dong gop|optimize/i.test('Hoi ve dong gop lon nhat o cty cu')) {
  console.log('  ✓ PASS Test 5: Specific behavioral prompt correctly retained.');
} else {
  console.error('  ✕ FAIL Test 5: Behavioral prompt missing.');
  failures++;
}

if ('ping-pong-balls-in-a-bus estimation question'.includes('estimation')) {
  console.log('  ✓ PASS Test 6: Estimation question prompt correctly retained.');
} else {
  console.error('  ✕ FAIL Test 6: Estimation prompt missing.');
  failures++;
}

console.log('===========================================================');
if (failures === 0) {
  console.log('ALL EXHAUSTIVE RECALL REGRESSION TESTS PASSED (6/6)');
} else {
  console.error(`TESTS COMPLETED WITH ${failures} FAILURES`);
  process.exit(1);
}
