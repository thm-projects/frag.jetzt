import { Component } from '@angular/core';
import { ComponentTestButtonComponent } from './component-test-button/component-test-button.component';
import { MatButtonModule } from '@angular/material/button';
import { NgForOf, NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import { ThemeService } from '../../../../../theme/theme.service';
import { Theme } from '../../../../../theme/Theme';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';

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
  ],
  styleUrl: './component-test-page.component.scss',
})
export class ComponentTestPageComponent {
  protected themes: Theme[];
  currentTheme: Theme;
  currentBackgroundColor: string;
  colorKeys = [
    'primary',
    'primary-variant',
    'secondary',
    'secondary-variant',
    'background',
    'surface',
    'dialog',
    'cancel',
    'alt-surface',
    'alt-dialog',
    'on-primary',
    'on-secondary',
    'on-primary-variant',
    'on-background',
    'on-surface',
    'on-dialog',
    'on-cancel',
    'green',
    'red',
    'white',
    'yellow',
    'blue',
    'purple',
    'magenta',
    'light-green',
    'grey',
    'grey-light',
    'black',
    'moderator',
    'questionwall-intro-primary',
    'questionwall-intro-secondary',
    'questionwall-intro-background',
    'livepoll-primary',
    'livepoll-primary--disabled',
    'livepoll-primary--hover',
    'on-livepoll-primary',
    'on-livepoll-primary--disabled',
    'on-livepoll-primary--hover',
    'livepoll-secondary',
    'livepoll-secondary--disabled',
    'livepoll-secondary--hover',
    'on-livepoll-secondary',
    'on-livepoll-secondary--disabled',
    'on-livepoll-secondary--hover',
  ];

  constructor(public readonly themeService: ThemeService) {
    this.themes = themeService.getThemes();
    themeService.getTheme().subscribe((theme) => {
      this.currentTheme = theme;
    });
  }
}
