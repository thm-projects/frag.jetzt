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
  OnInit,
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
import { SimpleAIService } from 'app/room/assistant-route/services/simple-ai.service';
import { room } from 'app/room/state/room';
import { map, startWith } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

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
    MatAutocompleteModule,
  ],
  templateUrl: './comment-info.component.html',
  styleUrl: './comment-info.component.scss',
})
export class CommentInfoComponent implements OnInit {
  comment = input.required<Comment>();
  protected readonly i18n = i18n;
  protected readonly contentTopic = new FormControl('');
  protected readonly availableCategories = computed(() => room.value().tags);
  protected readonly filteredOptions = signal<string[]>([]);
  private dialogRef = inject(MatDialogRef);
  private simpleAI = inject(SimpleAIService);
  private firstTopic: string = null;

  constructor() {
    effect(() => {
      const c = this.comment();
      // update topic
      this.firstTopic = null;
      this.simpleAI.createTopic([], c.body).subscribe((v) => {
        this.firstTopic = v;
        this.contentTopic.setValue(v);
      });
    });
  }

  ngOnInit(): void {
    this.contentTopic.valueChanges
      .pipe(
        startWith(''),
        map((value) => this._filter(value || '')),
      )
      .subscribe((v) => this.filteredOptions.set(v));
  }

  static open(
    injector: Injector,
    comment: Comment,
  ): MatDialogRef<CommentInfoComponent> {
    const ref = injector.get(MatDialog).open(CommentInfoComponent);
    ref.componentRef.setInput('comment', comment);
    return ref;
  }

  protected submit() {
    const c = this.comment();

    this.dialogRef.close(c);
  }

  private _filter(text: string) {
    text = text.toLowerCase();
    const keywords = this.comment().keywords;
    const set = new Set<string>();
    if (keywords?.entities) {
      keywords.entities.forEach((e) => set.add(e));
    }
    if (keywords?.keywords) {
      keywords.keywords.forEach((e) => set.add(e));
    }
    const start = Array.from(set).filter((option) =>
      option.toLowerCase().includes(text),
    );
    start.sort();
    if (this.firstTopic && this.firstTopic.toLowerCase().includes(text)) {
      const index = start.indexOf(this.firstTopic);
      if (index > -1) {
        start.splice(index, 1);
      }
      start.unshift(this.firstTopic);
    }
    return start;
  }
}
