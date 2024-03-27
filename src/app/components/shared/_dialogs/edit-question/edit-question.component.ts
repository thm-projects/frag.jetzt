import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Comment } from 'app/models/comment';
import { UserRole } from 'app/models/user-roles.enum';
import { CommentService } from 'app/services/http/comment.service';
import { ForumComment } from 'app/utils/data-accessor';
import { TSMap } from 'typescript-map';

@Component({
  selector: 'app-edit-question',
  templateUrl: './edit-question.component.html',
  styleUrls: ['./edit-question.component.scss'],
})
export class EditQuestionComponent {
  @Input() comment: ForumComment;
  @Input() tags: string[];
  @Input() userRole: UserRole;

  constructor(
    private ref: MatDialogRef<EditQuestionComponent>,
    private commentService: CommentService,
  ) {}

  createClick() {
    return (newComment) => {
      this.ref.close();
      if (!newComment) {
        return;
      }
      const changes = new TSMap<keyof Comment, unknown>();
      const newBody = newComment.body;
      if (newBody !== this.comment.body) {
        changes.set('body', newBody);
      }
      if (newComment.language !== this.comment.language) {
        changes.set('language', newComment.language);
      }
      const newKeyQuestioner = JSON.stringify(
        newComment.keywordsFromQuestioner,
      );
      if (
        newKeyQuestioner !== JSON.stringify(this.comment.keywordsFromQuestioner)
      ) {
        changes.set('keywordsFromQuestioner', newKeyQuestioner);
      }
      const newKeySpaCy = JSON.stringify(newComment.keywordsFromSpacy);
      if (newKeyQuestioner !== JSON.stringify(this.comment.keywordsFromSpacy)) {
        changes.set('keywordsFromSpacy', newKeySpaCy);
      }
      if (changes.size() === 0) {
        return;
      }
      this.commentService.patchComment(this.comment, changes).subscribe();
    };
  }
}
