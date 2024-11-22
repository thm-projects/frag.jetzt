import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.builder().build();
import { Component } from '@angular/core';
import { KeyboardUtils } from '../../../../utils/keyboard';
import { KeyboardKey } from '../../../../utils/keyboard/keys';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-demo-video',
  templateUrl: './demo-video.component.html',
  styleUrls: ['./demo-video.component.scss'],
  standalone: false,
})
export class DemoVideoComponent {
  protected readonly lang = language;
  protected readonly i18n = i18n;

  onKeyDown(e: KeyboardEvent) {
    if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Digit1)) {
      const iframe = document.getElementsByClassName('videoWrapper')[0]
        .children[0] as HTMLElement;
      const player = iframe as HTMLIFrameElement;
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
      this.focusElement(document.getElementById('selection'));
    }
  }

  private focusElement(element: HTMLElement) {
    setTimeout(() => {
      element.focus();
    }, 100);
  }
}
