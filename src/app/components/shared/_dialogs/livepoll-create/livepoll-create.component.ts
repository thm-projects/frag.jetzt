import { Component, OnInit } from '@angular/core';
import { LivepollTemplate, LivepollTemplateContext, templateContext } from '../../../../models/livepoll-template';
import { FormControl } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { LivepollConfiguration } from '../../../../models/livepoll-configuration';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../../services/util/language.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { DeviceInfoService } from '../../../../services/util/device-info.service';

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss']
})
export class LivepollCreateComponent implements OnInit {

  public readonly templateContext = templateContext;
  public readonly translateKey = 'create';
  public titleSelection: string;
  public templateSelection = new FormControl<LivepollTemplateContext>(templateContext[0]);
  public selectedPreviewOption: number = -1;
  public isResultVisible: boolean = false;
  public isViewsVisible: boolean = false;
  private _destroyer = new ReplaySubject(1);

  constructor(
    public readonly dialogRef: DialogRef<LivepollConfiguration>,
    public readonly translationService: TranslateService,
    public readonly languageService: LanguageService,
    public readonly http: HttpClient,
    public readonly device: DeviceInfoService
  ) {
    this.languageService.getLanguage().pipe(takeUntil(this._destroyer)).subscribe(lang => {
      this.translationService.use(lang);
      this.http.get('/assets/i18n/livepoll/' + lang + '.json')
        .subscribe(translation => {
          this.translationService.setTranslation(lang, translation, true);
        });
    });
  }

  create() {
    let templateKind: LivepollTemplate = LivepollTemplate.Symbol;
    if (this.templateSelection && this.templateSelection.value) {
      templateKind = this.templateSelection.value.kind;
    }
    this.dialogRef.close({
      template: templateKind,
      isLive: false,
      isResultVisible: this.isResultVisible,
      isViewsVisible: this.isViewsVisible,
      title: this.titleSelection
    });
  }

  ngOnInit(): void {
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

}
