import { User } from '../../../models/user';
import { QuestionWallComment } from './QuestionWallConfig';
import { Observable } from 'rxjs';

export interface QuestionWallSessionData {
  user:User;
  commentsObserver:Observable<QuestionWallComment[]>;
  resolvedCommentsObserver:Observable<QuestionWallComment[]>
}
