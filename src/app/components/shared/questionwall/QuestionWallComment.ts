import { Comment } from '../../../models/comment';

export class QuestionWallComment {

  constructor(
    public comment: Comment,
    public old: boolean
  ) {}

}
