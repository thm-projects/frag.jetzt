import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProfanityFilter, Room } from '../../../../models/room';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { RoomPatch, RoomService } from '../../../../services/http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';

interface Question {
  label: string;
  options: {label: string; value: string}[];
}

@Component({
  selector: 'app-room-settings-overview',
  templateUrl: './room-settings-overview.component.html',
  styleUrls: ['./room-settings-overview.component.scss'],
})
export class RoomSettingsOverviewComponent implements OnInit {
  @ViewChild(MatStepper) stepper!: MatStepper;
  @Input() room: Readonly<Room>;
  @Input() awaitComplete = false;
  directSend: boolean;
  conversationEnabled: boolean;
  profanityFilter: ProfanityFilter;
  bonusArchiveEnabled: boolean;
  quizEnabled: boolean;
  brainstormingEnabled: boolean;
  livepollEnabled: boolean;
  keywordExtrationEnabled: boolean;
  questionnaireForm: FormGroup;
  showQuestionsBasedOnAnswer: boolean;
  questions: Question[] = [
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
    {
      label: "Question 1",
      options: [
        {label: "Option 1", value: "option1"},
        {label: "Option 2", value: "option2"}
      ]
    },
  ]


  constructor(
    private dialogRef: MatDialogRef<RoomSettingsOverviewComponent>,
    private dialog: MatDialog,
    private roomService: RoomService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.directSend = this.room.directSend;
    this.conversationEnabled = this.room.conversationDepth > 0;
    this.profanityFilter = this.room.profanityFilter;
    this.bonusArchiveEnabled = this.room.bonusArchiveActive;
    this.quizEnabled = this.room.quizActive;
    this.brainstormingEnabled = this.room.brainstormingActive;
    this.livepollEnabled = this.room.livepollActive;
    this.keywordExtrationEnabled = this.room.keywordExtractionActive;
    this.showQuestionsBasedOnAnswer = true;

    this.questionnaireForm = this.formBuilder.group({});

    this.questions.forEach((question, index) => {
      this.questionnaireForm.addControl('answer' + index, new FormControl(''));
    });
  }

  onSubmitFirstQuestion() {
  }

  onSubmit() {
    // Handle form submission
    console.log('Form submitted:', this.questionnaireForm.value);
  }


  updateAnswer(questionIndex: number, value: string) {
    this.questionnaireForm.patchValue({ ['answer' + questionIndex]: value });
  }

  navigateToNext() {
    this.stepper?.next();
  }

  onConfirm() {
    const update: RoomPatch = {
      directSend: this.directSend,
      conversationDepth: this.conversationEnabled ? 7 : 0,
      profanityFilter: this.profanityFilter,
      bonusArchiveActive: this.bonusArchiveEnabled,
      quizActive: this.quizEnabled,
      brainstormingActive: this.brainstormingEnabled,
      livepollActive: this.livepollEnabled,
      keywordExtractionActive: this.keywordExtrationEnabled,
    };
    this.roomService.patchRoom(this.room.id, update).subscribe({
      next: () => {
        this.translateService
          .get('room-settings-overview.changes-successful')
          .subscribe((msg) => this.notificationService.show(msg));
        if (this.awaitComplete) {
          this.dialogRef.close(update);
        }
      },
      error: () => {
        this.translateService
          .get('room-settings-overview.changes-gone-wrong')
          .subscribe((msg) => this.notificationService.show(msg));
        if (this.awaitComplete) {
          this.dialogRef.close({});
        }
      },
    });
    if (!this.awaitComplete) {
      this.dialogRef.close(update);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  toggleProfanityFilter(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    this.profanityFilter =
      this.profanityFilter !== ProfanityFilter.DEACTIVATED
        ? ProfanityFilter.DEACTIVATED
        : ProfanityFilter.NONE;
  }

  toggleProfanityLanguage(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    if (this.profanityFilter === ProfanityFilter.ALL) {
      this.profanityFilter = ProfanityFilter.PARTIAL_WORDS;
    } else if (this.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC) {
      this.profanityFilter = ProfanityFilter.NONE;
    } else if (this.profanityFilter === ProfanityFilter.PARTIAL_WORDS) {
      this.profanityFilter = ProfanityFilter.ALL;
    } else if (this.profanityFilter === ProfanityFilter.NONE) {
      this.profanityFilter = ProfanityFilter.LANGUAGE_SPECIFIC;
    }
  }

  toggleProfanityWords(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    if (this.profanityFilter === ProfanityFilter.ALL) {
      this.profanityFilter = ProfanityFilter.LANGUAGE_SPECIFIC;
    } else if (this.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC) {
      this.profanityFilter = ProfanityFilter.ALL;
    } else if (this.profanityFilter === ProfanityFilter.PARTIAL_WORDS) {
      this.profanityFilter = ProfanityFilter.NONE;
    } else if (this.profanityFilter === ProfanityFilter.NONE) {
      this.profanityFilter = ProfanityFilter.PARTIAL_WORDS;
    }
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.room-settings-overview';
  }
}
