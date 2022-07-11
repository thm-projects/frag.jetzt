import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-room-page',
  templateUrl: './introduction-room-page.component.html',
  styleUrls: ['./introduction-room-page.component.scss']
})
export class IntroductionRoomPageComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<IntroductionRoomPageComponent>,
    public languageService: LanguageService,
  ) {
  }

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }

}
