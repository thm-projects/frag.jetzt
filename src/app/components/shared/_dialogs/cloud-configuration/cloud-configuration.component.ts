import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-cloud-configuration',
  templateUrl: './cloud-configuration.component.html',
  styleUrls: ['./cloud-configuration.component.scss']
})
export class CloudConfigurationComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CloudConfigurationComponent>) { }

  ngOnInit(): void {
  }

}
