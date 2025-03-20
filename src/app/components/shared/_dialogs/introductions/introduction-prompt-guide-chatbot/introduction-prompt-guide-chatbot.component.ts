import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-prompt-guide-chatbot',
  templateUrl: './introduction-prompt-guide-chatbot.component.html',
  styleUrls: ['./introduction-prompt-guide-chatbot.component.scss'],
  standalone: false,
})
export class IntroductionPromptGuideChatbotComponent {
  protected readonly language = language;
}
