import { Component, computed, signal } from '@angular/core';
import { ComponentTestButtonComponent } from './component-test-button/component-test-button.component';
import { MatButtonModule } from '@angular/material/button';
import { NgForOf, NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { ComponentTestCardComponent } from './component-test-card/component-test-card.component';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { ComponentTestChipComponent } from './component-test-chip/component-test-chip.component';
import { MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatLabel } from '@angular/material/form-field';
import { ComponentTestSectionComponent } from './component-test-section/component-test-section.component';
import { MatDivider } from '@angular/material/divider';
import { CustomMarkdownModule } from 'app/custom-markdown/custom-markdown.module';
import { MD_EXAMPLE } from 'app/custom-markdown/markdown-common/plugins';

@Component({
  selector: 'app-component-test-page',
  standalone: true,
  templateUrl: './component-test-page.component.html',
  imports: [
    ComponentTestButtonComponent,
    MatButtonModule,
    NgForOf,
    MatIconModule,
    NgStyle,
    MatExpansionModule,
    MatMenuModule,
    NgIf,
    NgTemplateOutlet,
    ComponentTestCardComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    FormsModule,
    ComponentTestChipComponent,
    MatCardTitle,
    MatLabel,
    ComponentTestSectionComponent,
    MatDivider,
    MatCardSubtitle,
    CustomMarkdownModule,
  ],
  styleUrl: './component-test-page.component.scss',
})
export class ComponentTestPageComponent {
  protected currentTheme: string = 'light';
  protected markdown = MD_EXAMPLE;
  protected markdownSignal = signal(this.markdown);
  protected count = computed(() => this.markdownSignal().length);

  constructor() {
    this.currentTheme = document.body.classList.contains('light')
      ? 'light'
      : 'dark';
  }
}
