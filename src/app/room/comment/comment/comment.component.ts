import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  Signal,
  signal,
  viewChild,
} from '@angular/core';
import { MarkdownViewerComponent } from 'app/base/custom-markdown/markdown-viewer/markdown-viewer.component';
import { ForumComment } from 'app/utils/data-accessor';
import { i18nContext } from 'app/base/i18n/i18n-context';
import {
  FormattedDate,
  getActualDate,
  getRelativeDate,
} from 'app/base/util/dateSignal';

export interface ValueOption<T> {
  value: T;
  state: 'valid' | 'pending';
}

@Component({
  selector: 'app-test-comment',
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss',
})
export class CommentComponent implements AfterViewInit {
  comment = input.required<ForumComment>();
  protected readonly i18n = i18n;
  protected readonly header = computed(() => this.formatCommentNumber());
  protected readonly vote = signal<ValueOption<0 | 1 | -1>>({
    value: 0,
    state: 'pending',
  });
  protected readonly isTaller = signal<boolean>(false);
  protected readonly isExpanded = signal<boolean>(false);
  protected readonly relativeDate = signal<string>('');
  protected formattedDate: Signal<FormattedDate> = signal({
    date: '',
    time: '',
  });
  protected contentWrapper =
    viewChild<ElementRef<HTMLDivElement>>('contentWrapper');
  protected editor = viewChild(MarkdownViewerComponent);
  private ref = inject(ElementRef);
  private injector = inject(Injector);

  constructor() {
    effect(
      (onCleanup) => {
        const c = this.comment();
        this.vote.set({ value: 0, state: 'valid' });
        this.formattedDate = getActualDate(c.createdAt);
        const sub = getRelativeDate(c.createdAt).subscribe((v) => {
          this.relativeDate.set(v);
        });
        onCleanup(() => sub.unsubscribe());
      },
      { allowSignalWrites: true },
    );
  }

  ngAfterViewInit(): void {
    this.editor().renderedPreview$.subscribe(() => {
      const div = this.contentWrapper().nativeElement;
      this.isTaller.set(div.clientHeight < div.scrollHeight);
    });
  }

  protected doVote(num: 1 | -1) {
    const v = this.vote();
    if (v.state === 'pending') {
      return;
    }
    this.vote.set({ value: v.value === num ? 0 : num, state: 'pending' });
    setTimeout(
      () => this.vote.update((v) => ({ ...v, state: 'valid' })),
      Math.random() * 3000,
    );
  }

  protected expandSwitch() {
    const div = this.contentWrapper().nativeElement;
    div.style.setProperty(
      '--height',
      this.isExpanded() ? '' : `${div.scrollHeight}px`,
    );
    this.isExpanded.update((v) => !v);
    if (!this.isExpanded()) {
      this.ref.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }

  private formatCommentNumber(): [string, string] {
    const c = this.comment();
    if (!c?.number) {
      return ['', ''];
    }
    const meta = c.number.split('/');
    const number = meta[meta.length - 1];
    const shortObj = {
      number,
      topLevelNumber: meta[0],
      level: String(meta.length - 1),
    };
    const obj = {
      number,
      author: c.questionerName,
      date: this.relativeDate(),
      short: '',
    };
    if (meta.length === 1) {
      // Question or idea
      if (c.brainstormingWordId) {
        obj.short = i18nContext(i18n().ideaShort, shortObj);
        return [
          i18nContext(
            i18n().headline[c.questionerName ? 'ideaAuthor' : 'idea'],
            obj,
          ),
          i18nContext(i18n().subTitle, obj),
        ];
      }
      obj.short = i18nContext(i18n().questionShort, shortObj);
      return [
        i18nContext(
          i18n().headline[c.questionerName ? 'questionAuthor' : 'question'],
          obj,
        ),
        i18nContext(i18n().subTitle, obj),
      ];
    }
    // Answer / Response
    // TODO: check main comment for type
    obj.short = i18nContext(i18n().questionShort, shortObj); // or ideaShort
    return [
      i18nContext(
        i18n().headline[c.questionerName ? 'answerAuthor' : 'answer'],
        obj,
      ),
      i18nContext(i18n().subTitle, obj),
    ];
  }
}
