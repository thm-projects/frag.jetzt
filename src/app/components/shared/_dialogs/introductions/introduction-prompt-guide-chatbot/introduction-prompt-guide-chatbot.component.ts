import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../../../../../services/util/language.service';

@Component({
  selector: 'app-introduction-prompt-guide-chatbot',
  templateUrl: './introduction-prompt-guide-chatbot.component.html',
  styleUrls: ['./introduction-prompt-guide-chatbot.component.scss'],
})
export class IntroductionPromptGuideChatbotComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<IntroductionPromptGuideChatbotComponent>,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {}

  onClose() {
    this.dialogRef.close();
  }
}
