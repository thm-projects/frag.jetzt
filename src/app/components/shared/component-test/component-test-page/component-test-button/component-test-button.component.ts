import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { ComponentTestSubSectionComponent } from '../component-test-sub-section/component-test-sub-section.component';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { EssentialsModule } from '../../../../essentials/essentials.module';
import { NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';

interface ToggleButtonGroup {
  vertical: boolean;
  multiple: boolean;
  entries: {
    name: string;
  }[];
}

@Component({
  selector: 'app-component-test-button',
  standalone: true,
  imports: [
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    ComponentTestSubSectionComponent,
    MatFormField,
    MatInput,
    EssentialsModule,
    NgForOf,
    NgIf,
    NgTemplateOutlet,
  ],
  templateUrl: './component-test-button.component.html',
  styleUrl: './component-test-button.component.scss',
})
export class ComponentTestButtonComponent {
  buttonText: string = 'label';
  iconText: string = 'face';
  private toggleButtonGroupEntries = [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' },
  ];
  toggleButtonGroup: ToggleButtonGroup = {
    entries: this.toggleButtonGroupEntries,
    multiple: false,
    vertical: false,
  };
  allVariants = ['primary', 'secondary', 'tertiary'];

  stringify(value: { [key: string]: unknown }) {
    return JSON.stringify(value);
  }
}
