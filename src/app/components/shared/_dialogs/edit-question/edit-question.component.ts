import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Comment } from 'app/models/comment';
import { UserRole } from 'app/models/user-roles.enum';
import { CommentService } from 'app/services/http/comment.service';
import { QuillUtils } from 'app/utils/quill-utils';
import { TSMap } from 'typescript-map';

@Component({
  selector: 'app-edit-question',
  templateUrl: './edit-question.component.html',
  styleUrls: ['./edit-question.component.scss'],
})
export class EditQuestionComponent implements OnInit {
  @Input() comment: Comment;
  @Input() tags: string[];
  @Input() userRole: UserRole;

  constructor(
    private ref: MatDialogRef<EditQuestionComponent>,
    private commentService: CommentService,
  ) {}

  ngOnInit(): void {}

  createClick() {
    return (newComment) => {
      this.ref.close();
      if (!newComment) {
        return;
      }
      const changes = new TSMap<keyof Comment, any>();
      const newBody = QuillUtils.serializeDelta(newComment.body);
      if (newBody !== QuillUtils.serializeDelta(this.comment.body)) {
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
