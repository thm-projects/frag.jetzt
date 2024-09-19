import { Component } from '@angular/core';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatCardModule} from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInput } from "@angular/material/input";
import { QRCodeModule } from "angularx-qrcode";

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [M3BodyPaneComponent, M3SupportingPaneComponent, MatCardModule, MatFormFieldModule, FormsModule, MatInput, QRCodeModule],
  templateUrl: './donation.component.html',
  styleUrl: './donation.component.scss',
})
export class DonationComponent {
  url = 'https://www.sandbox.paypal.com/ncp/payment/J4AV5JU5RMLU6';
}
