import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, effect, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { NotificationService } from 'app/services/util/notification.service';
import { SimpleAIService } from 'app/room/assistant-route/services/simple-ai.service';
import { comments } from 'app/room/state/comments';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoomService } from 'app/services/http/room.service';
import { room } from 'app/room/state/room';

@Component({
  selector: 'app-category-list-creator',
  imports: [
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    ContextPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-list-creator.component.html',
  styleUrl: './category-list-creator.component.scss',
})
export class CategoryListCreatorComponent {
  protected items = signal<string[]>([]);
  protected readonly min = 3;
  protected readonly max = 20;
  protected readonly i18n = i18n;
  protected readonly processing = signal<null | 'AI' | 'save'>(null);
  protected inputControl = new FormControl('', [
    (control) => {
      if (!control.value) return null;
      const len = control.value.trim().length;
      if (len < this.min) return { minlength: true };
      if (len > this.max) return { maxlength: true };
      return null;
    },
  ]);
  private notification = inject(NotificationService);
  private simpleAI = inject(SimpleAIService);
  private roomService = inject(RoomService);
  private dialogRef = inject(MatDialogRef);
  private beforeTags = [];

  constructor() {
    effect(() => {
      this.beforeTags = room.value().tags;
      this.items.set([...this.beforeTags]);
    });
  }

  protected save() {
    if (this.processing()) {
      return;
    }
    const currentTags = this.items();
    if (
      currentTags.length === this.beforeTags.length &&
      currentTags.every((tag) => this.beforeTags.includes(tag))
    ) {
      this.notification.show(this.i18n().noChanges);
      this.dialogRef.close(true);
      return;
    }
    this.processing.set('save');
    this.roomService
      .patchRoom(room.value().id, {
        tags: currentTags,
      })
      .subscribe({
        next: () => {
          this.notification.show(this.i18n().global.changeSuccessful);
          this.dialogRef.close(true);
          this.processing.set(null);
        },
        error: () => {
          this.notification.show(this.i18n().global.changesGoneWrong);
          this.processing.set(null);
        },
      });
  }

  protected createWithAI() {
    if (this.processing()) return;
    this.processing.set('AI');
    this.simpleAI
      .extractCategories(comments.value().map((e) => e.body))
      .subscribe({
        next: (categories) => {
          const newCategories = new Set(categories.map((e) => e.trim()));
          this.items.set([...newCategories]);
        },
        complete: () => this.processing.set(null),
        error: (error) => {
          console.log(error);
          this.notification.show(i18n().global.changesGoneWrong);
          this.processing.set(null);
        },
      });
  }

  protected onKeydown(event: KeyboardEvent) {
    this.inputControl.markAsTouched();
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Enter)) {
      event.preventDefault();
      this.submit();
    }
  }

  protected submit() {
    if (
      this.inputControl.invalid ||
      this.processing() ||
      !this.inputControl.value
    )
      return;
    const newValue = this.inputControl.value.trim();
    const found = this.items().find((v) => v === newValue);
    if (found) {
      this.notification.show(i18n().alreadyExists);
      return;
    }
    this.items.update((v) => [...v, newValue]);
    this.inputControl.reset('');
  }

  protected remove(i: number) {
    this.items.update((v) => v.filter((_, index) => index !== i));
  }
}
