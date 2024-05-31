import { Component } from '@angular/core';
import { M3BodyPaneComponent } from '../../../../../modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from '../../../../../modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-component-typography-test-page',
  standalone: true,
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatFormField,
    MatInput,
    FormsModule,
    NgClass,
    NgIf,
  ],
  templateUrl: './component-typography-test-page.component.html',
  styleUrl: './component-typography-test-page.component.scss',
})
export class ComponentTypographyTestPageComponent {
  exampleText: string = 'Example Text 123';
  sections = ['display', 'headline', 'title', 'body', 'label'];
  sizes = ['large', 'medium', 'small'];
}
