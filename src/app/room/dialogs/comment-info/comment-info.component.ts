import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { Comment } from 'app/models/comment';
import {
  Keywords,
  SimpleAIService,
} from 'app/room/assistant-route/services/simple-ai.service';
import { room } from 'app/room/state/room';
import { NotificationService } from 'app/services/util/notification.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { Subscription } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-comment-info',
  imports: [
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './comment-info.component.html',
  styleUrl: './comment-info.component.scss',
})
export class CommentInfoComponent {
  comment = input.required<Comment>();
  protected readonly i18n = i18n;
  protected readonly selectedCategory = new FormControl(null);
  protected readonly availableCategories = computed(() => room.value().tags);
  protected readonly keywords = signal<string[]>([]);
  protected readonly addKeyword = new FormControl(null, [
    (control) => {
      if (!control.value) return null;
      if (control.value.trim().length < 1) return { minlength: true };
      return null;
    },
  ]);
  protected isCategoryAvailable = computed(
    () => !this.comment().tag && this.availableCategories()?.length,
  );
  protected isKeywordAvailable = computed(
    () => room.value()?.keywordExtractionActive,
  );
  private dialogRef = inject(MatDialogRef);
  private notification = inject(NotificationService);
  private simpleAI = inject(SimpleAIService);
  private categorySub: Subscription = null;

  constructor() {
    effect((onCleanup) => {
      const sub = this.selectedCategory.valueChanges.subscribe(() =>
        this.categorySub?.unsubscribe(),
      );
      onCleanup(() => sub.unsubscribe());
    });
    effect(() => {
      const c = this.comment();
      // Set Tags
      this.selectedCategory.setValue(c.tag);
      const tags = this.availableCategories();
      if (tags?.length) {
        this.categorySub = this.simpleAI
          .selectCategory(tags, c.body)
          .subscribe((v) => this.selectedCategory.setValue(v));
      }
      // Update keywords
      const data = c.keywordsFromSpacy as unknown as Keywords;
      const set = new Set([
        ...data.keywords,
        ...data.entities,
        ...data.special,
      ]);
      this.keywords.set([...set]);
    });
  }

  static shouldOpen(comment: Comment): boolean {
    const r = room.value();
    const isCategoryAvailable = Boolean(!comment.tag && r?.tags?.length);
    const isKeywordAvailable = r?.keywordExtractionActive;
    return isCategoryAvailable || isKeywordAvailable;
  }

  static open(
    injector: Injector,
    comment: Comment,
  ): MatDialogRef<CommentInfoComponent> {
    if (!this.shouldOpen(comment)) return null;
    const ref = injector.get(MatDialog).open(CommentInfoComponent);
    ref.componentRef.setInput('comment', comment);
    const c = ref.componentInstance;
    if (!c.isKeywordAvailable() && !c.isCategoryAvailable()) {
      ref.close(comment);
    }
    return ref;
  }

  protected removeAt(i: number) {
    this.keywords.update((k) => k.filter((_, index) => index !== i));
  }

  protected onKeydown(event: KeyboardEvent) {
    this.addKeyword.markAsTouched();
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Enter)) {
      event.preventDefault();
      this.appendKeyword();
    }
  }

  protected appendKeyword() {
    if (!this.addKeyword.value || this.addKeyword.invalid) return;
    const newValue = this.addKeyword.value.trim();
    const current = this.keywords();
    if (current.includes(newValue)) {
      this.notification.show(i18n().alreadyPresent);
      return;
    }
    this.addKeyword.reset();
    this.keywords.update((k) => [...k, newValue]);
  }

  protected submit() {
    const c = this.comment();
    c.tag = this.selectedCategory.value;
    c.keywordsFromQuestioner = this.keywords().map((s) => ({
      text: s,
      dep: [],
    }));
    this.dialogRef.close(c);
  }
}
