import { Component } from '@angular/core';
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
import { CustomMarkdownModule } from 'app/custom-markdown/custom-markdown.module';

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
    CustomMarkdownModule,
  ],
  styleUrl: './component-test-page.component.scss',
})
export class ComponentTestPageComponent {
  protected currentTheme: string = 'light';
  themeList = ['light', 'dark'];

  constructor() {
    this.currentTheme = document.body.classList.contains('light')
      ? 'light'
      : 'dark';
  }

  setTheme() {
    for (const string of this.themeList) {
      document.body.classList.remove(string);
    }
    document.body.classList.add(this.currentTheme);
  }
}
