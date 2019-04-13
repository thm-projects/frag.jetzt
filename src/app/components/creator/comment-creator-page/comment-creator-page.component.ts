import { Component, OnInit } from '@angular/core';
import { CommentService } from '../../../services/http/comment.service';
import { MatDialog } from '@angular/material';
import { CommentExportComponent } from '../_dialogs/comment-export/comment-export.component';

@Component({
  selector: 'app-comment-creator-page',
  templateUrl: './comment-creator-page.component.html',
  styleUrls: ['./comment-creator-page.component.scss']
})
export class CommentCreatorPageComponent implements OnInit {

  constructor(private commentService: CommentService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.commentService.exportButton.subscribe(s => {
      if (s === true) {
        this.showExportDialog();
      }
    });
  }

  showExportDialog(): void {
    this.commentService.exportButtonClicked(false);
    if (this.dialog.openDialogs.length === 0) {
      this.dialog.open(CommentExportComponent, {
        width: '400px', height: '300px'
      });
    }
  }
}
