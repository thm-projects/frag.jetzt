import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-room-page',
  templateUrl: './introduction-room-page.component.html',
  styleUrls: ['./introduction-room-page.component.scss'],
})
export class IntroductionRoomPageComponent {
  constructor(
    private dialogRef: MatDialogRef<IntroductionRoomPageComponent>,
    public languageService: LanguageService,
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}
