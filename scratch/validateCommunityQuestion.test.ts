import { validateCommunityQuestion } from '../src/features/community/utils/validateCommunityQuestion';
import { CommunityQuestionFormValues } from '../src/features/community/types/community';

function createValidValues(): CommunityQuestionFormValues {
  return {
    title: '[QA] What is the difference between let and const in JavaScript?',
    categoryId: 'a0000000-0000-0000-0000-000000000003', // JavaScript
    topic: 'Variables & Scope',
    difficulty: 'Intermediate',
    type: 'Multiple Choice',
    shortSummary: 'Tests understanding of block-scoped variable declarations in JS.',
    explanation: 'let allows re-assignment while const binds the reference and cannot be reassigned.',
    options: [
      'let allows reassignment, const does not',
      'const is function scoped, let is block scoped',
      'let is hoisted, const is not',
      'There is no difference',
    ],
    correctAnswer: 'let allows reassignment, const does not',
    codeSnippet: 'const x = 10; x = 20; // TypeError',
    interviewTip: 'Mention temporal dead zone (TDZ) for extra points in junior/mid interviews.',
  };
}

function runTests() {
  console.log('Running validateCommunityQuestion unit tests...\n');

  // Test 1: Valid values
  {
    const valid = createValidValues();
    const errors = validateCommunityQuestion(valid);
    if (Object.keys(errors).length !== 0) {
      throw new Error(`Expected 0 errors, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 1: Valid Multiple Choice question passed');
  }

  // Test 2: Blank title
  {
    const values = createValidValues();
    values.title = '';
    const errors = validateCommunityQuestion(values);
    if (errors.title !== 'Question title is required.') {
      throw new Error(`Expected title error, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 2: Blank title validation passed');
  }

  // Test 3: Whitespace-only title
  {
    const values = createValidValues();
    values.title = '   \t  \n ';
    const errors = validateCommunityQuestion(values);
    if (errors.title !== 'Question title is required.') {
      throw new Error(`Expected title error for whitespace, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 3: Whitespace-only title validation passed');
  }

  // Test 4: Blank summary
  {
    const values = createValidValues();
    values.shortSummary = '   ';
    const errors = validateCommunityQuestion(values);
    if (errors.shortSummary !== 'Short summary is required.') {
      throw new Error(`Expected shortSummary error, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 4: Blank summary validation passed');
  }

  // Test 5: Blank explanation
  {
    const values = createValidValues();
    values.explanation = '';
    const errors = validateCommunityQuestion(values);
    if (errors.explanation !== 'Explanation is required.') {
      throw new Error(`Expected explanation error, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 5: Blank explanation validation passed');
  }

  // Test 6: Duplicate MC options
  {
    const values = createValidValues();
    values.options = [
      'let allows reassignment',
      'LET ALLOWS REASSIGNMENT', // duplicate case-insensitive
      'Option 3',
      'Option 4',
    ];
    values.correctAnswer = 'let allows reassignment';
    const errors = validateCommunityQuestion(values);
    if (errors.options !== 'All answer options must be unique.') {
      throw new Error(`Expected duplicate options error, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 6: Duplicate MC options validation passed');
  }

  // Test 7: Invalid correct answer
  {
    const values = createValidValues();
    values.correctAnswer = 'Option 5 not in list';
    const errors = validateCommunityQuestion(values);
    if (errors.correctAnswer !== 'The correct answer must match one of the answer options exactly.') {
      throw new Error(`Expected invalid correctAnswer error, got: ${JSON.stringify(errors)}`);
    }
    console.log('✔ Test 7: Invalid correct answer validation passed');
  }

  console.log('\nAll 7 validation unit tests PASSED!');
}

runTests();
