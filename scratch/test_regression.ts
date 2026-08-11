import { questionService } from '../src/features/questions/services/questionService';

async function testBeforeFix() {
  const commId = 'comm-0c0fa6d6fde9454d9c0773234046781f';
  console.log('Testing getQuestionById with ID:', commId);
  const result = await questionService.getQuestionById(commId);
  console.log('Result before fix:', result);
  if (result === null) {
    console.log('FAILED BEFORE FIX as expected! Result is null.');
  } else {
    console.log('PASSED!');
  }
}

testBeforeFix();
