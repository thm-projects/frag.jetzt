import { Component, Input } from '@angular/core';
import { MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { NgIf } from '@angular/common';
import { MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'app-component-test-sub-section',
  standalone: true,
  imports: [MatCardSubtitle, MatDivider, NgIf, MatDialogTitle, MatCardTitle],
  templateUrl: './component-test-sub-section.component.html',
  styleUrl: './component-test-sub-section.component.scss',
})
export class ComponentTestSubSectionComponent {
  @Input() title: string | undefined;
  @Input() subTitle: string | undefined;
  @Input() grid: boolean = false;
}
