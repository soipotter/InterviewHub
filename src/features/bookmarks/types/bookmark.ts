import { Question } from '../../questions/types/question';

export interface BookmarkItem {
  id: string;
  userId: string;
  questionId: string;
  createdAt: string;
  question?: Question;
}
