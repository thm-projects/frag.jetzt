import { Component, OnInit, HostListener, Inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { KeyboardUtils } from '../../../../utils/keyboard';
import { KeyboardKey } from '../../../../utils/keyboard/keys';

@Component({
  selector: 'app-present-comment',
  templateUrl: './present-comment.component.html',
  styleUrls: ['./present-comment.component.scss']
})
export class PresentCommentComponent implements OnInit {
  public body: string;
  // flag for fullscreen
  private fs = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public dialogRef: MatDialogRef<PresentCommentComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    /*  if document is in fullscreen and user presses ESC, it doesn't trigger a keyup event */
    this.document.addEventListener('fullscreenchange', () => {
      if (this.fs && this.document.exitFullscreen) {
        this.onCloseClick();
      } else {
        this.fs = true;
      }
    });
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    // ToDo: migrate from deprecated event api
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true) {
      this.onCloseClick();
    }
  }

  onCloseClick(): void {
    this.dialogRef.close('close');
  }

  updateFontSize(event: any): void {
     document.getElementById('comment').style.fontSize = (event.value * 2.5) + 'em';
  }
}
