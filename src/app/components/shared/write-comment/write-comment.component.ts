import { Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguagetoolResult, LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
import { LanguageService } from '../../../services/util/language.service';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import { DeepLService, SourceLang, TargetLang } from '../../../services/http/deep-l.service';
import { DeepLDialogComponent, ResultValue } from '../_dialogs/deep-ldialog/deep-ldialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { CreateCommentKeywords } from '../../../utils/create-comment-keywords';
import { CreateCommentComponent } from '../_dialogs/create-comment/create-comment.component';
import { BrainstormingSession } from '../../../models/brainstorming-session';

type SubmitFunction = (commentData: string, commentText: string, selectedTag: string, name?: string,
                       verifiedWithoutDeepl?: boolean) => any;

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
  @Input() onSubmit: SubmitFunction;
  @Input() onDeeplSubmit: SubmitFunction;
  @Input() isSpinning = false;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<any>;
  @Input() enabled = true;
  @Input() isCommentAnswer = false;
  @Input() placeholder = 'comment-page.enter-comment';
  @Input() i18nSection = 'comment-page';
  @Input() isQuestionerNameEnabled = false;
  @Input() brainstormingData: BrainstormingSession;
  @Input() allowEmpty = false;
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
  brainstormingInfo: string;
  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  questionerNameFormControl = new FormControl('', [
    Validators.minLength(this.questionerNameMin), Validators.maxLength(this.questionerNameMax)
  ]);
  private _wasVerifiedWithoutDeepl = false;

  constructor(private notification: NotificationService,
              private languageService: LanguageService,
              private translateService: TranslateService,
              public languagetoolService: LanguagetoolService,
              private deeplService: DeepLService,
              private dialog: MatDialog) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    if (this.brainstormingData) {
      this.translateService.get('comment-page.brainstorming-placeholder', this.brainstormingData)
        .subscribe(msg => this.placeholder = msg);
      this.translateService.get(this.brainstormingData.maxWordCount === 1 ?
        'comment-page.brainstorming-info-single' :
        'comment-page.brainstorming-info-multiple', this.brainstormingData)
        .subscribe(msg => this.brainstormingInfo = msg);
    }
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

  buildCreateCommentActionCallback(func: SubmitFunction): () => void {
    if (!func) {
      return undefined;
    }
    return () => {
      let allowed = true;
      const data = this.commentData.currentData;
      const text = this.commentData.currentText;
      if (this.isQuestionerNameEnabled) {
        this.questionerNameFormControl.setValue((this.questionerNameFormControl.value || '').trim());
        allowed = !this.questionerNameFormControl.hasError('minlength') &&
          !this.questionerNameFormControl.hasError('maxlength');
      }
      if (this.brainstormingData &&
        CreateCommentComponent.getWords(text).length > this.brainstormingData.maxWordCount) {
        this.translateService.get('comment-page.error-comment-brainstorming', this.brainstormingData)
          .subscribe(msg => this.notification.show(msg));
        allowed = false;
      }
      if (this.allowEmpty || (ViewCommentDataComponent.checkInputData(data, text,
        this.translateService, this.notification, this.maxTextCharacters, this.maxDataCharacters) && allowed)) {
        const realData = this.allowEmpty && text.length < 2 ? null : data;
        func(realData, text, this.selectedTag, this.questionerNameFormControl.value, this._wasVerifiedWithoutDeepl);
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
        (selected) => {
          if (selected.view === this.commentData) {
            this._wasVerifiedWithoutDeepl = true;
            this.commentData.buildMarks(rawText, wordsCheck);
          } else {
            this.commentData.currentData = selected.body;
            this.commentData.copyMarks(selected.view);
          }
        });
    }, () => {
      this.isSpellchecking = false;
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto' ? wordsCheck.language.detectedLanguage.confidence >= 0.5 : true;
  }

  isSpellcheckingButtonDisabled(): boolean {
    if (!this.commentData) {
      return true;
    }
    const text = this.commentData.currentText;
    return text.length < 5 || text.trim().split(/\s+/, 3).length < 3;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  private openDeeplDialog(body: string,
                          text: string,
                          result: LanguagetoolResult,
                          onClose: (selected: ResultValue) => void) {
    let target = TargetLang.EN_US;
    const code = result.language.detectedLanguage.code.toUpperCase().split('-')[0];
    const source = code in SourceLang ? SourceLang[code] : null;
    if (code.startsWith(SourceLang.EN)) {
      target = TargetLang.DE;
    }
    CreateCommentKeywords.generateDeeplDelta(this.deeplService, body, target)
      .subscribe(([improvedBody, improvedText]) => {
        this.isSpellchecking = false;
        if (improvedText.replace(/\s+/g, '') === text.replace(/\s+/g, '')) {
          onClose({ body, text, view: this.commentData });
          return;
        }
        const instance = this.dialog.open(DeepLDialogComponent, {
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
            onClose,
            target: DeepLService.transformSourceToTarget(source),
            usedTarget: target
          }
        });
        instance.afterClosed().subscribe((val) => {
          if (val) {
            this.buildCreateCommentActionCallback(this.onDeeplSubmit)();
          } else {
            onClose({ body, text, view: this.commentData });
          }
        });
      }, (_) => {
        this.isSpellchecking = false;
        onClose({ body, text, view: this.commentData });
      });
  }

}
