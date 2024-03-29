import { Component } from '@angular/core';
import { M3BodyPaneComponent } from '../../../../../modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from '../../../../../modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { NgForOf } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

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
export class ComponentLayoutTestPageComponent {}
