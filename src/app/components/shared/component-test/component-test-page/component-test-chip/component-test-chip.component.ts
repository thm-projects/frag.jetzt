import { Component, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormControl } from '@angular/forms';
import { EssentialsModule } from '../../../../essentials/essentials.module';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-component-test-chip',
  imports: [EssentialsModule, NgForOf],
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
