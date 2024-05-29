import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss'],
})
export class DataProtectionComponent {
  protected readonly lang = language;
}
