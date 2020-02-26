import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { KeyboardUtils } from '../../../../utils/keyboard';
import { KeyboardKey } from '../../../../utils/keyboard/keys';

@Component({
  selector: 'app-demo-video',
  templateUrl: './demo-video.component.html',
  styleUrls: ['./demo-video.component.scss']
})
export class DemoVideoComponent implements OnInit, OnDestroy {

  deviceType: string;
  currentLang: string;
  keyEvent: any;

  constructor(public dialogRef: MatDialogRef<DemoVideoComponent>,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
    document.getElementById('setFocus').focus();
    window.addEventListener('keydown', this.keyEvent = e => {
      if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Digit1)) {
        const iframe = <HTMLElement>document.getElementsByClassName('videoWrapper')[0].children[0];
        const player = <HTMLIFrameElement>iframe;
        if (player.src.charAt(player.src.length - 1) === '0') {
          player.src = player.src.split('?')[0] + '?autoplay=1';
        } else {
          player.src = player.src.split('?')[0] + '?autoplay=0';
        }
        this.focusElement(iframe);
      } else if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Digit2)) {
        this.focusElement(document.getElementById('demoContentTranscript'));
      } else if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Digit3)) {
        this.focusElement(document.getElementById('demoContent'));
      } else if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Digit4)) {
        this.focusElement((document.getElementById('selection')));
      }
    });
  }

  private focusElement(element: HTMLElement) {
    setTimeout(() => {
      element.focus();
    }, 100);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.keyEvent);
  }
}
