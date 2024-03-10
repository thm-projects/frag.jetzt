import { Component, inject } from '@angular/core';
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRow,
} from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { FormControl } from '@angular/forms';
import { EssentialsModule } from '../../../../essentials/essentials.module';
import { ThemePalette } from '@angular/material/core';
import { ComponentTestSubSectionComponent } from '../component-test-sub-section/component-test-sub-section.component';

export interface ChipColor {
  name: string;
  color: ThemePalette;
}
@Component({
  selector: 'app-component-test-chip',
  standalone: true,
  imports: [
    MatChipInput,
    MatButton,
    MatFormField,
    MatChipGrid,
    MatChipRow,
    MatIcon,
    EssentialsModule,
    ComponentTestSubSectionComponent,
  ],
  templateUrl: './component-test-chip.component.html',
  styleUrl: './component-test-chip.component.scss',
})
export class ComponentTestChipComponent {
  keywords = ['angular', 'how-to', 'tutorial', 'accessibility'];
  formControl = new FormControl(['angular']);

  availableColors: ChipColor[] = [
    { name: 'none', color: undefined },
    { name: 'Primary', color: 'primary' },
    { name: 'Accent', color: 'accent' },
    { name: 'Warn', color: 'warn' },
  ];
  announcer = inject(LiveAnnouncer);

  removeKeyword(keyword: string) {
    const index = this.keywords.indexOf(keyword);
    if (index >= 0) {
      this.keywords.splice(index, 1);

      this.announcer.announce(`removed ${keyword}`);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      this.keywords.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }
}
