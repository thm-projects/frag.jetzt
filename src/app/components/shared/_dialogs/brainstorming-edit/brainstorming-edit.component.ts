import { DialogRef } from '@angular/cdk/dialog';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AVAILABLE_LANGUAGES } from 'app/base/language/language';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { UserRole } from 'app/models/user-roles.enum';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-brainstorming-edit',
  templateUrl: './brainstorming-edit.component.html',
  styleUrls: ['./brainstorming-edit.component.scss'],
  standalone: false,
})
export class BrainstormingEditComponent implements OnInit {
  @Input() target: string;
  @Input() userRole: UserRole;
  @Input() session: BrainstormingSession;

  maxWordCountMin = 1;
  maxWordCountMax = 5;
  maxWordCount = new FormControl(1, [
    Validators.required,
    Validators.min(this.maxWordCountMin),
    Validators.max(this.maxWordCountMax),
  ]);
  maxWordLengthMin = 2;
  maxWordLengthMax = 30;
  maxWordLength = new FormControl(20, [
    Validators.required,
    Validators.min(this.maxWordLengthMin),
    Validators.max(this.maxWordLengthMax),
  ]);
  question = '';
  brainstormingDuration = 15;
  brainstormingAllowIdeas = true;
  brainstormingAllowRating = true;
  roomSubscription: Subscription;
  isCreating = false;
  readonly languages = [...AVAILABLE_LANGUAGES];
  language = new FormControl('en', [Validators.required]);

  constructor(
    private brainstormingService: BrainstormingService,
    private dialogRef: DialogRef<BrainstormingEditComponent>,
  ) {}

  ngOnInit(): void {
    this.question = this.session.title;
    this.maxWordLength.setValue(this.session.maxWordLength);
    this.maxWordCount.setValue(this.session.maxWordCount);
    this.language.setValue(this.session.language);
    this.brainstormingDuration = this.session.ideasTimeDuration;
    this.brainstormingAllowIdeas = !this.session.ideasFrozen;
    this.brainstormingAllowRating = this.session.ratingAllowed;
  }

  canCreate() {
    return this.question && this.maxWordCount.valid && this.maxWordLength.valid;
  }

  checkForEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.update();
    }
  }

  displayMin(v) {
    return v + 'min';
  }

  getDuration(): string {
    return this.brainstormingDuration.toString().padStart(2, '0');
  }

  update() {
    if (!this.canCreate()) {
      return;
    }
    if (this.isCreating) {
      return;
    }
    this.isCreating = true;
    const changes: Partial<BrainstormingSession> = {};
    if (this.question.trim() !== this.session.title) {
      changes.title = this.question.trim();
    }
    if (this.maxWordLength.value !== this.session.maxWordLength) {
      changes.maxWordLength = this.maxWordLength.value;
    }
    if (this.maxWordCount.value !== this.session.maxWordCount) {
      changes.maxWordCount = this.maxWordCount.value;
    }
    if (this.language.value !== this.session.language) {
      changes.language = this.language.value;
    }
    if (this.brainstormingDuration !== this.session.ideasTimeDuration) {
      changes.ideasTimeDuration = this.brainstormingDuration;
    }
    if (this.brainstormingAllowIdeas === this.session.ideasFrozen) {
      changes.ideasFrozen = !this.brainstormingAllowIdeas;
    }
    if (this.brainstormingAllowRating !== this.session.ratingAllowed) {
      changes.ratingAllowed = this.brainstormingAllowRating;
    }
    if (Object.keys(changes).length < 1) {
      this.isCreating = false;
      return;
    }
    if (this.session.ideasEndTimestamp) {
      changes.ideasEndTimestamp = null;
    }
    this.brainstormingService.patchSession(this.session.id, changes).subscribe({
      next: () => {
        this.isCreating = false;
        this.dialogRef.close();
      },
      error: () => {
        this.isCreating = false;
        this.dialogRef.close();
      },
    });
  }
}
