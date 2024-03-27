import { Component, inject } from '@angular/core';
import { MatChipGrid, MatChipInput, MatChipRow } from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { FormControl } from '@angular/forms';
import { EssentialsModule } from '../../../../essentials/essentials.module';
import { ComponentTestSubSectionComponent } from '../component-test-sub-section/component-test-sub-section.component';
import { NgForOf } from '@angular/common';

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
    NgForOf,
  ],
  templateUrl: './component-test-chip.component.html',
  styleUrl: './component-test-chip.component.scss',
})
export class ComponentTestChipComponent {
  keywords = ['angular', 'how-to', 'tutorial', 'accessibility'];
  formControl = new FormControl(['angular']);

  announcer = inject(LiveAnnouncer);

  allVariants = ['default', 'primary', 'secondary', 'tertiary'];
  listbox = {
    multiple: false,
  };
}
