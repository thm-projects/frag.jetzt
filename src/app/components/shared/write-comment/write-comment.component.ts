import { Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguagetoolResult, LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { LanguageService } from '../../../services/util/language.service';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import { DeepLService, SourceLang, TargetLang } from '../../../services/http/deep-l.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeepLDialogComponent } from '../_dialogs/deep-ldialog/deep-ldialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss']
})
export class WriteCommentComponent implements OnInit {

  @ViewChild(ViewCommentDataComponent) commentData: ViewCommentDataComponent;
  @ViewChild('langSelect') langSelect: ElementRef<HTMLDivElement>;
  @Input() isModerator = false;
  @Input() tags: string[];
  @Input() onClose: () => any;
  @Input() onSubmit: (commentData: string, commentText: string, selectedTag: string) => any;
  @Input() isSpinning = false;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<any>;
  @Input() enabled = true;
  @Input() isCommentAnswer = false;
  @Input() placeholder = 'comment-page.enter-comment';
  @Input() i18nSection = 'comment-page';
  comment: Comment;
  selectedTag: string;
  maxTextCharacters = 500;
  maxDataCharacters = 2500;
  // Grammarheck
  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';
  isSpellchecking = false;
  hasSpellcheckConfidence = true;
  newLang = 'auto';

  constructor(private notification: NotificationService,
              private languageService: LanguageService,
              private translateService: TranslateService,
              public eventService: EventService,
              public languagetoolService: LanguagetoolService,
              private deeplService: DeepLService,
              private dialog: MatDialog,
              public deepl: DeepLService) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  public static checkInputData(data: string,
                               text: string,
                               translateService: TranslateService,
                               notificationService: NotificationService,
                               maxTextCharacters: number,
                               maxDataCharacters: number): boolean {
    text = text.trim();
    if (text.length < 1 && data.length < 1) {
      translateService.get('comment-page.error-comment').subscribe(message => {
        notificationService.show(message);
      });
      return false;
    } else if (text.length > maxTextCharacters) {
      translateService.get('comment-page.error-comment-text').subscribe(message => {
        notificationService.show(message);
      });
      return false;
    } else if (data.length > maxDataCharacters) {
      translateService.get('comment-page.error-comment-data').subscribe(message => {
        notificationService.show(message);
      });
      return false;
    }
    return true;
  }

  private static encodeHTML(str: string): string {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static decodeHTML(str: string): string {
    return str.replace(/&apos;/g, '\'')
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    if (this.isCommentAnswer) {
      this.maxTextCharacters = this.isModerator ? 2000 : 0;
    } else {
      this.maxTextCharacters = this.isModerator ? 1000 : 500;
    }
    this.maxDataCharacters = this.isModerator ? this.maxTextCharacters * 5 : this.maxTextCharacters * 3;
  }

  buildCloseDialogActionCallback(): () => void {
    if (!this.onClose || this.disableCancelButton) {
      return undefined;
    }
    return () => this.onClose();
  }

  buildCreateCommentActionCallback(): () => void {
    if (!this.onSubmit) {
      return undefined;
    }
    return () => {
      if (WriteCommentComponent.checkInputData(this.commentData.currentData, this.commentData.currentText,
        this.translateService, this.notification, this.maxTextCharacters, this.maxDataCharacters)) {
        this.onSubmit(this.commentData.currentData, this.commentData.currentText, this.selectedTag);
      }
    };
  }

  checkGrammar() {
    this.grammarCheck(this.commentData.currentText, this.langSelect && this.langSelect.nativeElement);
  }

  grammarCheck(rawText: string, langSelect: HTMLSpanElement): void {
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    this.checkSpellings(rawText).subscribe((wordsCheck) => {
      if (!this.checkLanguageConfidence(wordsCheck)) {
        this.hasSpellcheckConfidence = false;
        this.isSpellchecking = false;
        return;
      }
      if (this.selectedLang === 'auto' &&
        (langSelect.innerText.includes(this.newLang) || langSelect.innerText.includes('auto'))) {
        if (wordsCheck.language.name.includes('German')) {
          this.selectedLang = 'de-DE';
        } else if (wordsCheck.language.name.includes('English')) {
          this.selectedLang = 'en-US';
        } else if (wordsCheck.language.name.includes('French')) {
          this.selectedLang = 'fr';
        } else {
          this.newLang = wordsCheck.language.name;
        }
        langSelect.innerHTML = this.newLang;
      }
      const previous = this.commentData.currentData;
      this.openDeeplDialog(previous, rawText, wordsCheck,
        (data: string, text: string, view: ViewCommentDataComponent) => {
          if (view === this.commentData) {
            this.commentData.buildMarks(rawText, wordsCheck);
          } else {
            this.commentData.currentData = data;
            this.commentData.copyMarks(view);
          }
        });
    }, () => {
      this.isSpellchecking = false;
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto' ? wordsCheck.language.detectedLanguage.confidence >= 0.5 : true;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  private openDeeplDialog(body: string,
                          text: string,
                          result: LanguagetoolResult,
                          onClose: (data: string, text: string, view: ViewCommentDataComponent) => void) {
    let target = TargetLang.EN_US;
    if (result.language.detectedLanguage.code.toUpperCase().startsWith(SourceLang.EN)) {
      target = TargetLang.DE;
    }
    this.generateDeeplDelta(body, target).subscribe(([improvedBody, improvedText]) => {
      this.isSpellchecking = false;
      if (improvedText.replace(/\s+/g, '') === text.replace(/\s+/g, '')) {
        onClose(body, text, this.commentData);
        return;
      }
      this.dialog.open(DeepLDialogComponent, {
        width: '900px',
        maxWidth: '100%',
        data: {
          body,
          text,
          improvedBody,
          improvedText,
          maxTextCharacters: this.maxTextCharacters,
          maxDataCharacters: this.maxDataCharacters,
          isModerator: this.isModerator,
          result,
          onClose
        }
      });
    }, (_) => {
      this.isSpellchecking = false;
      onClose(body, text, this.commentData);
    });
  }

  private generateDeeplDelta(body: string, targetLang: TargetLang): Observable<[string, string]> {
    const delta = ViewCommentDataComponent.getDeltaFromData(body);
    const xml = delta.ops.reduce((acc, e, i) => {
      if (typeof e['insert'] === 'string' && e['insert'].trim().length) {
        acc += '<x i="' + i + '">' + WriteCommentComponent.encodeHTML(e['insert']) + '</x>';
        e['insert'] = '';
      }
      return acc;
    }, '');
    return this.deeplService.improveTextStyle(xml, targetLang).pipe(
      map(str => {
        const regex = /<x i="(\d+)">([^<]+)<\/x>/gm;
        let m;
        while ((m = regex.exec(str)) !== null) {
          delta.ops[+m[1]]['insert'] += WriteCommentComponent.decodeHTML(m[2]);
        }
        const text = delta.ops.reduce((acc, el) => acc + (typeof el['insert'] === 'string' ? el['insert'] : ''), '');
        return [ViewCommentDataComponent.getDataFromDelta(delta), text];
      })
    );
  }

}
