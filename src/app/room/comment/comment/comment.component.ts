import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  Signal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MarkdownViewerComponent } from 'app/base/custom-markdown/markdown-viewer/markdown-viewer.component';
import { i18nContext } from 'app/base/i18n/i18n-context';
import {
  FormattedDate,
  getActualDate,
  getRelativeDate,
} from 'app/base/util/dateSignal';
import { moderatorsSet, room } from 'app/room/state/room';
import { user } from 'app/user/state/user';
import { UIComment } from 'app/room/state/comment-updates';

export interface ValueOption<T> {
  value: T;
  state: 'valid' | 'pending';
}

export interface Filter {
  type: 'keyword' | 'tag' | 'user';
  option?: unknown;
}

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss',
  standalone: false,
})
export class CommentComponent {
  inputComment = input.required<UIComment>();
  filterSelect = output<Filter>();
  onlyShowUp = input(false);
  showAnswers = model(false);
  protected comment = computed(() => this.inputComment()?.comment);
  protected readonly i18n = i18n;
  protected readonly header = computed(() => this.formatCommentNumber());
  protected readonly isTaller = signal<boolean>(false);
  protected readonly isExpanded = signal<boolean>(false);
  protected readonly relativeDate = signal<string>('');
  protected readonly icon = computed(() => this.getIcon());
  protected formattedDate: Signal<FormattedDate> = signal({
    date: '',
    time: '',
  });
  protected contentWrapper =
    viewChild<ElementRef<HTMLDivElement>>('contentWrapper');
  protected editor = viewChild(MarkdownViewerComponent);
  private ref = inject(ElementRef);
  private readonly resize = new ResizeObserver(() => this.checkSize());

  constructor() {
    // time
    effect((onCleanup) => {
      const c = this.comment();
      this.formattedDate = getActualDate(c.createdAt);
      const sub = getRelativeDate(c.createdAt).subscribe((v) => {
        this.relativeDate.set(v);
      });
      onCleanup(() => sub.unsubscribe());
    });
    // resize
    effect((onCleanup) => {
      this.comment();
      this.resize.disconnect();
      const div = untracked(() => this.contentWrapper().nativeElement);
      this.resize.observe(div);
      onCleanup(() => this.resize.disconnect());
    });
  }

  protected selectFilter(filter: Filter) {
    this.filterSelect.emit(filter);
  }

  protected expandSwitch() {
    this.isExpanded.update((v) => !v);
    this.checkSize();
    if (!this.isExpanded()) {
      this.ref.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }

  protected checkSize() {
    const expanded = this.isExpanded();
    const div = this.contentWrapper().nativeElement;
    const actualHeight = (div.firstElementChild as HTMLElement).offsetHeight;
    if (expanded) {
      div.style.setProperty('--height', `${actualHeight}px`);
    } else {
      div.style.setProperty('--height', '');
      this.isTaller.set(div.clientHeight < actualHeight);
    }
  }

  private getIcon(): [string, string] {
    const c = this.comment();
    if (!c) return ['', ''];
    // brainstorm, own, moderator, owner, ai
    if ((c?.brainstormingSessionId || null) !== null) {
      return ['tips_and_updates', i18n().isBrainstorm];
    }
    const u = user();
    if (u?.id === c.creatorId) {
      return ['person', i18n().fromOwn];
    }
    const r = room.value();
    const isOwner = r?.ownerId === c.creatorId;
    if (isOwner) {
      return ['co_present', i18n().fromOwner];
    }
    const isModerator = moderatorsSet().has(u?.id);
    if (isModerator) {
      return ['support_agent', i18n().fromModerator];
    }
    if (c.gptWriterState !== 0) {
      return ['robot', i18n().withAI];
    }
    return ['group', i18n().fromParticipant];
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
    obj.short = i18nContext(i18n().answerShort, shortObj); // or ideaShort
    return [
      i18nContext(
        i18n().headline[c.questionerName ? 'answerAuthor' : 'answer'],
        obj,
      ),
      i18nContext(i18n().subTitle, obj),
    ];
  }
}
