import { Component, Input } from '@angular/core';
import { MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'app-component-test-sub-section',
  imports: [MatCardTitle],
  templateUrl: './component-test-sub-section.component.html',
  styleUrl: './component-test-sub-section.component.scss',
})
export class ComponentTestSubSectionComponent {
  @Input() title: string | undefined;
  @Input() subTitle: string | undefined;
  @Input() grid: boolean = false;
}
