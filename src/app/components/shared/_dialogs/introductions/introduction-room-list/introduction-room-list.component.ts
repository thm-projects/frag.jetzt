import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../../services/util/language.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-introduction-room-list',
  templateUrl: './introduction-room-list.component.html',
  styleUrls: ['./introduction-room-list.component.scss']
})
export class IntroductionRoomListComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<IntroductionRoomListComponent>,
    public languageService: LanguageService,
  ) {
  }

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }

}
