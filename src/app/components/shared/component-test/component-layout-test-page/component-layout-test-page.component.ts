import { Component } from '@angular/core';
import { M3BodyPaneComponent } from '../../../../../modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from '../../../../../modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { NgForOf } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { M3NavigationService } from '../../../../../modules/m3/services/navigation/m3-navigation.service';
import {
  M3State,
  M3TemplateKind,
} from '../../../../../modules/m3/components/navigation/m3-navigation-types';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'app-component-layout-test-page',
  standalone: true,
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    NgForOf,
    MatButton,
    MatIcon,
  ],
  templateUrl: './component-layout-test-page.component.html',
  styleUrl: './component-layout-test-page.component.scss',
})
export class ComponentLayoutTestPageComponent {
  constructor(private readonly m3NavigationService: M3NavigationService) {
    this.m3NavigationService.emit({
      elevation: 0,
      header: {
        kind: M3TemplateKind.Header,
        component: HeaderComponent,
      },
      kind: M3TemplateKind.Navigation,
      rail: {
        kind: M3TemplateKind.Rail,
        title: 'Component-Layout',
      },
      railExtension: {
        kind: M3TemplateKind.RailExtension,
        sections: [
          {
            kind: M3TemplateKind.RailSection,
            title: 'test',
            labels: [
              {
                kind: M3TemplateKind.Label,
                text: 'test',
                icon: 'face',
                state: M3State.Active,
              },
            ],
          },
        ],
      },
    });
  }
}
