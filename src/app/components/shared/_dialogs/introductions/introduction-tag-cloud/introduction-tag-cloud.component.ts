import { Component, computed } from '@angular/core';
import { language } from 'app/base/language/language';
import { room } from 'app/room/state/room';

@Component({
  selector: 'app-introduction-tag-cloud',
  templateUrl: './introduction-tag-cloud.component.html',
  styleUrls: ['./introduction-tag-cloud.component.scss'],
  standalone: false,
})
export class IntroductionTagCloudComponent {
  protected readonly language = language;
  protected isPle = computed(() => room.value()?.mode === 'PLE');
}
