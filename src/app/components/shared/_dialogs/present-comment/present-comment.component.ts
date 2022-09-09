import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DOCUMENT } from '@angular/common';
import { KeyboardUtils } from '../../../../utils/keyboard';
import { KeyboardKey } from '../../../../utils/keyboard/keys';
import { ImmutableStandardDelta } from '../../../../utils/quill-utils';

@Component({
  selector: 'app-present-comment',
  templateUrl: './present-comment.component.html',
  styleUrls: ['./present-comment.component.scss']
})
export class PresentCommentComponent implements OnInit {
  public body: ImmutableStandardDelta;
  // flag for fullscreen
  private fs = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public dialogRef: MatDialogRef<PresentCommentComponent>,
    public dialog: MatDialog,
  ) {
  }

  onKeyUp(event: KeyboardEvent) {
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true) {
      this.onCloseClick();
    }
  }

  ngOnInit() {
    /*  if document is in fullscreen and user presses ESC, it doesn't trigger a keyup event */
    this.document.addEventListener('fullscreenchange', () => {
      if (this.fs && this.document.exitFullscreen) {
        this.onCloseClick();
      } else {
        this.fs = true;
      }
    });
  }

  onCloseClick(): void {
    this.dialogRef.close('close');
  }

  updateFontSize(event: any): void {
    document.getElementById('comment').style.fontSize = (event.value * 2.5) + 'em';
  }
}
