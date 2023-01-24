import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GPTModels } from 'app/models/GPTModels';
import { GptService } from 'app/services/http/gpt.service';
import { NotificationService } from 'app/services/util/notification.service';

@Component({
  selector: 'app-gpt-configuration',
  templateUrl: './gpt-configuration.component.html',
  styleUrls: ['./gpt-configuration.component.scss'],
})
export class GptConfigurationComponent implements OnInit {
  apiKey: string;
  organization: string;
  model: string;
  models: GPTModels;

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.gptService.getModelsOnce().subscribe({
      next: (m) => (this.models = m),
      error: () => {
        this.translateService.get("gpt-config.model-fetch-error").subscribe(msg => this.notificationService.show(msg));
      },
    });
  }
}
