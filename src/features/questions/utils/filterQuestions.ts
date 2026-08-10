import { Question, QuestionFilters } from '../types/question';

export function filterQuestions(questions: Question[], filters: QuestionFilters): Question[] {
  const searchTerm = filters.q ? filters.q.trim().toLowerCase() : '';

  return questions.filter((question) => {
    // 1. Search Query Filter (Title, ShortSummary, Topic, Tags)
    if (searchTerm) {
      const matchTitle = question.title.toLowerCase().includes(searchTerm);
      const matchSummary = question.shortSummary.toLowerCase().includes(searchTerm);
      const matchTopic = question.topic.toLowerCase().includes(searchTerm);
      const matchTags = question.tags.some((tag) => tag.toLowerCase().includes(searchTerm));

      if (!matchTitle && !matchSummary && !matchTopic && !matchTags) {
        return false;
      }
    }

    // 2. Category Filter
    if (filters.category && filters.category !== 'All') {
      if (question.category !== filters.category) {
        return false;
      }
    }

    // 3. Difficulty Filter
    if (filters.difficulty && filters.difficulty !== 'All') {
      if (question.difficulty !== filters.difficulty) {
        return false;
      }
    }

    // 4. Type Filter
    if (filters.type && filters.type !== 'All') {
      if (question.type !== filters.type) {
        return false;
      }
    }

    return true;
  });
}

export function paginateQuestions(
  questions: Question[],
  page: number = 1,
  pageSize: number = 10
): { data: Question[]; totalPages: number; currentPage: number } {
  const totalItems = questions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const data = questions.slice(startIndex, startIndex + pageSize);

  return {
    data,
    totalPages,
    currentPage,
  };
}
