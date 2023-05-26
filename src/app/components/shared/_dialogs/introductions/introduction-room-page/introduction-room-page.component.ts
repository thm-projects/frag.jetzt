import { Component, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-room-page',
  templateUrl: './introduction-room-page.component.html',
  styleUrls: ['./introduction-room-page.component.scss'],
})
export class IntroductionRoomPageComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<IntroductionRoomPageComponent>,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {}

  onClose() {
    this.dialogRef.close();
  }
}
