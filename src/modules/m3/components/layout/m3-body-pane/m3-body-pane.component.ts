import { Component, Input } from '@angular/core';

@Component({
  selector: 'm3-body-pane',
  standalone: true,
  imports: [],
  template: '<ng-content></ng-content>',
  styleUrl: './m3-body-pane.component.scss',
  host: {
    '[class.m3-body-pane-center-single-pane]': 'centerSinglePane',
  },
})
export class M3BodyPaneComponent {
  @Input('center-single-pane') centerSinglePane!: boolean;
}
