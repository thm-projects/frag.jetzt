import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-cloud-dialog',
  templateUrl: './topic-cloud-dialog.component.html',
  styleUrls: ['./topic-cloud-dialog.component.scss']
})
export class TopicCloudDialogComponent implements OnInit {

  public panelOpenState: boolean;
  public keywords: {
    "Cloud",
    "SWTP",
    "Frage",
    "Klausur"
  };

  constructor() { }

  ngOnInit(): void {
  }

}
