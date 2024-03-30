import { Component } from '@angular/core';

@Component({
  selector: 'm3-body-pane',
  standalone: true,
  imports: [],
  template: '<ng-content></ng-content>',
  styleUrl: './m3-body-pane.component.scss',
})
export class M3BodyPaneComponent {}
