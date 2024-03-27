import { Component, Input } from '@angular/core';
import { MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'app-component-test-section',
  standalone: true,
  imports: [MatCardTitle],
  templateUrl: './component-test-section.component.html',
  styleUrl: './component-test-section.component.scss',
})
export class ComponentTestSectionComponent {
  @Input() title: string;
}
