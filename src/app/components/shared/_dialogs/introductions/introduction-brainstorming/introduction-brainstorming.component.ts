import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-brainstorming',
  templateUrl: './introduction-brainstorming.component.html',
  styleUrls: ['./introduction-brainstorming.component.scss']
})
export class IntroductionBrainstormingComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<IntroductionBrainstormingComponent>,
    public languageService: LanguageService,
  ) {
  }

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }

}
