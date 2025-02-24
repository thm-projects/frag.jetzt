import { Component, input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Comment } from 'app/models/comment';
import { CommentService } from 'app/services/http/comment.service';
import { TSMap } from 'typescript-map';

@Component({
  selector: 'app-edit-question',
  templateUrl: './edit-question.component.html',
  styleUrls: ['./edit-question.component.scss'],
  standalone: false,
})
export class EditQuestionComponent {
  comment = input<Comment>(null);

  constructor(
    private ref: MatDialogRef<EditQuestionComponent>,
    private commentService: CommentService,
  ) {}

  static open(
    dialog: MatDialog,
    comment: Comment,
  ): MatDialogRef<EditQuestionComponent> {
    const ref = dialog.open(EditQuestionComponent);
    ref.componentRef.setInput('comment', comment);
    return ref;
  }

  create(c: Comment) {
    this.ref.close();
    if (!c) {
      return;
    }
    const changes = new TSMap<keyof Comment, unknown>();
    const newBody = c.body;
    if (newBody !== this.comment().body) {
      changes.set('body', newBody);
    }
    if (c.language !== this.comment().language) {
      changes.set('language', c.language);
    }
    const newKeyQuestioner = JSON.stringify(c.keywordsFromQuestioner);
    if (c.tag !== this.comment().tag) {
      changes.set('tag', c.tag);
    }
    if (
      newKeyQuestioner !== JSON.stringify(this.comment().keywordsFromQuestioner)
    ) {
      changes.set('keywordsFromQuestioner', newKeyQuestioner);
    }
    const newKeySpaCy = JSON.stringify(c.keywordsFromSpacy);
    if (newKeyQuestioner !== JSON.stringify(this.comment().keywordsFromSpacy)) {
      changes.set('keywordsFromSpacy', newKeySpaCy);
    }
    if (changes.size() === 0) {
      return;
    }
    this.commentService.patchComment(this.comment(), changes).subscribe();
  }
}
