import { Component } from '@angular/core';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [M3BodyPaneComponent, M3SupportingPaneComponent],
  templateUrl: './donation.component.html',
  styleUrl: './donation.component.scss',
})
export class DonationComponent {}
