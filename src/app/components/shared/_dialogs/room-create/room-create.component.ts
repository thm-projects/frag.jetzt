import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { UserRole } from '../../../../models/user-roles.enum';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { defaultCategories } from '../../../../utils/defaultCategories';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SessionService } from '../../../../services/util/session.service';
import { RoomSettingsOverviewComponent } from '../room-settings-overview/room-settings-overview.component';
import { GptService } from 'app/services/http/gpt.service';
import { ReplaySubject, switchMap, takeUntil } from 'rxjs';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatStep } from '@angular/material/stepper';

const invalidRegex = /[^A-Z0-9_\-.~]+/gi;

interface Option {
  label: string;
  value: string;
}

interface Question {
  label: string;
  type: 'options' | 'input' | 'toggle' | 'code-generation';
  options?: Option[];
  inputValue?: string;
  toggleValue?: boolean;
  callback?: () => void;
  categories: string[];
  skipByIfAnswerIsNo?: number;
  isHidden?: boolean; // Added property to manage visibility
}

@Component({
  selector: 'app-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss'],
})
export class RoomCreateComponent implements OnInit, OnDestroy {
  @ViewChild('firstFixedStep') firstFixedStep!: MatStep;
  @ViewChild('secondFixedStep') secondFixedStep!: MatStep;
  @ViewChild('thirdFixedStep') thirdFixedStep!: MatStep;

  selectedOption: string = ''; // Initialize with an empty string or default value
  roomCodeChoice: string = ''; // Initialize with an empty string or default value
  manualRoomCode: string = ''; // Initialize with an empty string or default value
  useDefaultSettings: boolean = false;

  originalQuestions: Question[] = [
    {
      label: 'Can the user set up ChatGPT?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars', 'ple'],
      skipByIfAnswerIsNo: 3,
    },
    {
      label: 'Enable ChatGPT for Q&A forum?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars', 'ple'],
      skipByIfAnswerIsNo: 2,
    },
    {
      label: 'Create AI StudyBuddy?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars', 'ple'],
      skipByIfAnswerIsNo: 1,
    },
    {
      label: 'Who can use ChatGPT?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars'],
    },
    {
      label: 'Generate keywords from posts?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars', 'ple'],
    },
    {
      label: 'Enable the Topic Radar module?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ple', 'ars'],
    },
    {
      label: 'Enable the Topic Focus module?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ple', 'ars'],
    },
    {
      label: 'Enable the brainstorming module?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ple', 'ars'],
    },
    {
      label: 'Moderate Q&A forum?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars'],
    },
    {
      label: 'Enable profanity filter?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars'],
    },
    {
      label: 'Enable Flash Polls?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars'],
    },
    {
      label: 'Enable the bonus archive?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars'],
    },
    {
      label: 'Enable the quiz module?',
      type: 'toggle',
      toggleValue: true,
      categories: ['ars'],
    },
  ];

  questionnaireForm: FormGroup;
  currentStep: number = 0;
  showQuestionsBasedOnAnswer: boolean;
  questions: Question[] = [...this.originalQuestions];
  arsOrPle: string = "all";
  showSubmitButton: boolean = false;
  showNextButton: boolean = true;

  showDynamicQuestions = false;

  shortIdAlreadyUsed = false;
  room: Room;
  roomId: string;
  user: User;
  hasCustomShortId = true;
  isLoading = false;
  readonly roomNameLengthMin = 3;
  readonly roomNameLengthMax = 30;
  roomNameFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(this.roomNameLengthMin),
    Validators.maxLength(this.roomNameLengthMax),
  ]);
  readonly shortIdLengthMin = 3;
  readonly shortIdLengthMax = 30;
  roomShortIdFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(this.shortIdLengthMin),
    Validators.maxLength(this.shortIdLengthMax),
    Validators.pattern('[a-zA-Z0-9_\\-.~]+'),
    this.verifyAlreadyUsed.bind(this),
  ]);
  private destroyer = new ReplaySubject(1);

  

  constructor(
    private roomService: RoomService,
    private router: Router,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<RoomCreateComponent>,
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sessionService: SessionService,
    private dialog: MatDialog,
    private gptService: GptService,
    private accountState: AccountStateService,
    private appState: AppStateService,
    private formBuilder: FormBuilder,
  ) {}

  get filteredQuestions(): Question[] {
    return this.questions.filter(question => true);
  }

  ngOnInit() {
    this.accountState.user$
      .pipe(takeUntil(this.destroyer))
      .subscribe((newUser) => (this.user = newUser));

      this.showQuestionsBasedOnAnswer = true;

      const formGroupConfig: { [key: string]: FormControl } = {};
      this.questions.forEach((question, index) => {
        formGroupConfig['answer' + index] = new FormControl(question.toggleValue);
      });

      this.questionnaireForm = this.formBuilder.group(formGroupConfig);

      this.questionnaireForm.valueChanges
      .pipe(takeUntil(this.destroyer))
      .subscribe((formValue) => {
        this.updateQuestionVisibility(formValue);
      });

      /*this.questionnaireForm.get('answer0')?.valueChanges.subscribe((value) => {
        this.arsOrPle = value;
        this.questions = this.filterQuestionsByAnswer(value);
      });

      this.questionnaireForm.get('answer2')?.valueChanges.subscribe((value) => {
        this.showDynamicQuestions = !value;
      });*/
  }

  // Listen for changes in selectedOption
  onOptionChange() {
    console.log('Selected Option:', this.selectedOption);
    this.arsOrPle = this.selectedOption;
    console.log(this.questions);
    this.questions = this.filterQuestionsByAnswer(this.selectedOption);
    console.log(this.questions);
  }

  // Listen for changes in roomCodeChoice
  onRoomCodeChoiceChange() {
    console.log('Room Code Choice:', this.roomCodeChoice);
    // Perform actions or updates based on the room code choice
    // For example: if (this.roomCodeChoice === 'manual') { ... }
  }

  // Listen for changes in manualRoomCode
  onManualRoomCodeChange() {
    console.log('Manual Room Code:', this.manualRoomCode);
    // Perform actions or updates based on the manually entered room code
  }

  // Listen for changes in useDefaultSettings
  onDefaultSettingsChange() {
    console.log('Use Default Settings:', this.useDefaultSettings);
    this.showDynamicQuestions = this.useDefaultSettings;
  }

  onToggleChange(questionIndex: number, toggleValue: boolean) {
    const question = this.questions[questionIndex];
    console.log(question);

    if (toggleValue === false && question.skipByIfAnswerIsNo) {
      const nextQuestionsToSkip = question.skipByIfAnswerIsNo;
  
      // Hide the subsequent questions
      for (let i = 1; i <= nextQuestionsToSkip; i++) {
        const nextQuestionIndex = questionIndex + i;
        if (nextQuestionIndex < this.questions.length) {
          this.questionnaireForm.get(`answer${nextQuestionIndex}`).setValue(false);
          this.questionnaireForm.get(`answer${nextQuestionIndex}`).disable();
        }
      }
    }
  }

  updateQuestionVisibility(formValue: any): void {
    this.questions.forEach((question, index) => {
      const answerValue = formValue[`answer${index}`];

      if (question.skipByIfAnswerIsNo && answerValue === 'No') {
        const skipBy = question.skipByIfAnswerIsNo;

        // Hide the specified number of questions after the current one
        for (let i = index + 1; i <= index + skipBy; i++) {
          const nextQuestion = this.questions[i];
          if (nextQuestion) {
            nextQuestion.isHidden = true;
            formValue[`answer${i}`] = ''; // Reset skipped question's value
          }
        }
      } else {
        // Show questions that are not skipped
        if (question.isHidden) {
          question.isHidden = false;
        }
      }
    });
  }

  onSubmit() {
    // Handle form submission
    console.log('Form submitted:', this.questionnaireForm.value);
  }

  filterQuestionsByAnswer(answer: string): Question[] {
    return this.originalQuestions.filter(question => {
      return question.categories.includes(answer.toLowerCase()) || question.categories.includes('both');
    });
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  resetInvalidCharacters(): void {
    this.shortIdAlreadyUsed = false;
    if (this.roomShortIdFormControl.value) {
      this.roomShortIdFormControl.setValue(
        this.roomShortIdFormControl.value.replace(invalidRegex, ''),
      );
    }
  }

  navigateToNext(stepper: any) {
    const currentStep = stepper.selectedIndex;
    const selectedAnswer = this.questionnaireForm.get('answer' + currentStep)?.value;
    console.log(`Answer for step ${currentStep}: ${selectedAnswer}`);
  }

  verifyAlreadyUsed(c: FormControl) {
    return this.shortIdAlreadyUsed
      ? {
          shortId: {
            valid: false,
          },
        }
      : null;
  }

  checkLogin() {
    if (this.isLoading) {
      return;
    }
    if (this.roomNameFormControl.value) {
      this.roomNameFormControl.setValue(this.roomNameFormControl.value.trim());
    }
    if (this.roomNameFormControl.invalid) {
      return;
    }
    if (this.hasCustomShortId && this.roomShortIdFormControl.invalid) {
      return;
    }
    this.isLoading = true;
    if (!this.user) {
      this.accountState.forceLogin().subscribe(() => {
        this.addRoom(this.roomNameFormControl.value);
      });
    } else {
      this.addRoom(this.roomNameFormControl.value);
    }
  }

  addRoom(longRoomName: string) {
    longRoomName = longRoomName.trim();
    if (!longRoomName) {
      this.isLoading = false;
      return;
    }
    const categories =
      defaultCategories[this.appState.getCurrentLanguage()] ||
      defaultCategories.default;
    const newRoom = new Room({
      name: longRoomName,
      tags: [...categories],
      shortId: this.hasCustomShortId
        ? this.roomShortIdFormControl.value
        : undefined,
      directSend: true,
    });
    this.roomService
      .addRoom(newRoom, () => {
        this.shortIdAlreadyUsed = true;
        this.roomShortIdFormControl.updateValueAndValidity();
        this.isLoading = false;
      })
      .subscribe((room) => {
        this.createDefaultTopic(room.id);
        this.room = room;
        this.translateService
          .get('home-page.created', { longRoomName })
          .subscribe((msg) => this.notification.show(msg));
        this.accountState
          .setAccess(room.shortId, room.id, UserRole.CREATOR)
          .subscribe();
        this.accountState.updateAccess(room.shortId);
        this.router
          .navigate(['/creator/room/' + encodeURIComponent(room.shortId)])
          .then(() => {
            this.sessionService.getRoomOnce().subscribe((enteredRoom) => {
              const ref = this.dialog.open(RoomSettingsOverviewComponent, {
                width: '600px',
              });
              ref.componentInstance.room = enteredRoom;
            });
          });
        this.closeDialog();
      });
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildRoomCreateActionCallback(): () => void {
    return () => this.checkLogin();
  }

  /**
   * Closes the room create dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  private createDefaultTopic(roomId: string) {
    this.translateService
      .get('home-page.gpt-topic-general')
      .subscribe((msg) => {
        this.gptService
          .getStatusForRoom(roomId)
          .pipe(
            switchMap(() =>
              this.gptService.patchPreset(roomId, {
                topics: [
                  {
                    description: msg,
                    active: true,
                  },
                ],
              }),
            ),
          )
          .subscribe();
      });
  }
}
