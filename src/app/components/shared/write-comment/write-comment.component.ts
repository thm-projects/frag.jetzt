import { AfterViewInit, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { GrammarChecker } from '../../../utils/grammar-checker';
import { TranslateService } from '@ngx-translate/core';
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss']
})
export class WriteCommentComponent implements OnInit, AfterViewInit {

  @ViewChild('langSelect') langSelect: ElementRef<HTMLDivElement>;
  @ViewChild('commentBody') commentBody: ElementRef<HTMLDivElement>;
  @Input() user: User;
  @Input() tags: string[];
  @Input() onClose: () => any;
  @Input() onSubmit: (commentText: string, selectedTag: string) => any;
  @Input() isSpinning = false;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<any>;
  @Input() enabled = true;
  comment: Comment;
  selectedTag: string;
  grammarChecker: GrammarChecker;
  tempEditView: string;

  constructor(private notification: NotificationService,
              private translateService: TranslateService,
              public eventService: EventService,
              public languagetoolService: LanguagetoolService) {
    this.grammarChecker = new GrammarChecker(this.languagetoolService);
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  ngAfterViewInit() {
    this.grammarChecker.initBehavior(() => this.commentBody.nativeElement, () => this.langSelect.nativeElement);
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
      if (this.checkInputData(this.commentBody.nativeElement.innerText)) {
        this.onSubmit(this.commentBody.nativeElement.innerText, this.selectedTag);
      }
    };
  }

  onTabChange() {
    this.tempEditView = this.commentBody.nativeElement.innerText;
  }

  private checkInputData(body: string): boolean {
    body = body.trim();
    if (!body) {
      this.translateService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    return true;
  }

}
