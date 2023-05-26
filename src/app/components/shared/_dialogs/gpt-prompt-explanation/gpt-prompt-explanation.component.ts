import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-gpt-prompt-explanation',
  templateUrl: './gpt-prompt-explanation.component.html',
  styleUrls: ['./gpt-prompt-explanation.component.scss'],
})
export class GptPromptExplanationComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<GptPromptExplanationComponent>,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {}

  onClose() {
    this.dialogRef.close();
  }
}
