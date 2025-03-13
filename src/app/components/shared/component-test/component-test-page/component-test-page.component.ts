import { Component } from '@angular/core';
import { ComponentTestButtonComponent } from './component-test-button/component-test-button.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { ComponentTestCardComponent } from './component-test-card/component-test-card.component';
import { FormsModule } from '@angular/forms';
import { ComponentTestChipComponent } from './component-test-chip/component-test-chip.component';
import { MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { ComponentTestSectionComponent } from './component-test-section/component-test-section.component';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { M3BodyPaneComponent } from '../../../../../modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from '../../../../../modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { ComponentTestMarkdownComponent } from './component-test-markdown/component-test-markdown.component';

@Component({
  selector: 'app-component-test-page',
  templateUrl: './component-test-page.component.html',
  imports: [
    ComponentTestButtonComponent,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatMenuModule,
    ComponentTestCardComponent,
    FormsModule,
    ComponentTestChipComponent,
    MatCardTitle,
    ComponentTestSectionComponent,
    MatCardSubtitle,
    CustomMarkdownModule,
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    ComponentTestMarkdownComponent,
  ],
  styleUrl: './component-test-page.component.scss',
})
export class ComponentTestPageComponent {}
