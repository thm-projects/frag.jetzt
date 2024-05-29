import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
})
export class ImprintComponent {
  protected readonly lang = language;
}
