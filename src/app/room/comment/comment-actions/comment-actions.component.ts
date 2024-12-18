import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { toSignal } from '@angular/core/rxjs-interop';
import { RoomStateService } from 'app/services/state/room-state.service';
import { room } from 'app/room/state/room';
import { DashboardNotificationService } from 'app/services/util/dashboard-notification.service';
import { ValueOption } from '../comment/comment.component';
import { Observable, take } from 'rxjs';
import { Router } from '@angular/router';
import { EventService } from 'app/services/util/event.service';
import { SessionService } from 'app/services/util/session.service';
import { UIComment } from 'app/room/state/comment-updates';

@Component({
  selector: 'app-comment-actions',
  templateUrl: './comment-actions.component.html',
  styleUrl: './comment-actions.component.scss',
  standalone: false,
})
export class CommentActionsComponent {
  inputComment = input.required<UIComment>();
  showAnswers = model(false);
  onlyShowUp = input(false);
  protected comment = computed(() => this.inputComment()?.comment);
  protected totalCount = computed(() => {
    const c = this.inputComment()?.totalAnswerCount;
    if (!c) return 0;
    return c.participants + c.moderators + c.creator;
  });
  protected readonly i18n = i18n;
  protected readonly isSmall = computed(() => {
    const state = windowWatcher.windowState();
    return (
      state === M3WindowSizeClass.Compact || state === M3WindowSizeClass.Medium
    );
  });
  private assignedRole = toSignal(inject(RoomStateService).assignedRole$, {
    initialValue: 'Participant',
  });
  protected readonly hasAI = computed(() => room.value()?.chatGptActive);
  protected readonly canReply = computed(() => {
    const c = this.comment();
    if (!c) return false;
    const r = room.value();
    if (!r) return false;
    const role = this.assignedRole();
    return (
      c.commentDepth < r.conversationDepth ||
      r.conversationDepth === -1 ||
      role !== 'Participant'
    );
  });
  private dashboardNotificationService = inject(DashboardNotificationService);
  protected readonly canNotify = computed(
    () => !this.dashboardNotificationService.isNotificationBlocked(),
  );
  protected readonly hasNotification = signal<ValueOption<boolean>>({
    value: false,
    state: 'pending',
  });
  protected readonly canGoUp = computed(() => this.onlyShowUp());
  protected readonly canToggleAnswers = computed(
    () =>
      !this.onlyShowUp() &&
      (this.showAnswers() || this.inputComment().children.size),
  );
  private canOpenGPT = signal(false);
  private router = inject(Router);
  private eventService = inject(EventService);

  constructor(sessionService: SessionService) {
    effect(() => {
      const c = this.comment();
      if (!c) return;
      this.hasNotification.set({
        value: this.dashboardNotificationService.hasCommentSubscription(c.id),
        state: 'valid',
      });
    });
    sessionService
      .getGPTStatusOnce()
      .subscribe((v) => this.canOpenGPT.set(Boolean(v) && !v.restricted));
  }

  protected navigateWriteAnswer() {
    this.router.navigate([`${this.getBaseUrl()}comment/${this.comment().id}`]);
  }

  protected navigateUp() {
    let url = `${this.getBaseUrl()}comment`;
    const ref = this.comment().commentReference;
    url = ref ? url + '/' + ref + '/conversation' : url + 's';
    this.router.navigate([url]);
  }

  protected toggleShowAnswers() {
    this.showAnswers.update((v) => !v);
  }

  protected toggleNotify() {
    const current = this.hasNotification();
    if (current.state === 'pending') return;
    this.hasNotification.set({
      value: !current.value,
      state: 'pending',
    });
    let obs: Observable<unknown>;
    if (current.value) {
      obs = this.dashboardNotificationService.deleteCommentSubscription(
        this.comment().id,
      );
    } else {
      obs = this.dashboardNotificationService.addCommentSubscription(
        room.value().id,
        this.comment().id,
      );
    }
    obs.subscribe({
      complete: () =>
        this.hasNotification.update((v) => ({ ...v, state: 'valid' })),
      error: () => this.hasNotification.set(current),
    });
  }

  protected chatWithAI() {
    /*if (!this.canOpenGPT()) {
      GPTChatInfoComponent.open(this.dialog);
      return;
    }*/
    const url = `${this.getBaseUrl()}gpt-chat-room`;
    this.eventService
      .on('gptchat-room.init')
      .pipe(take(1))
      .subscribe(() => {
        this.eventService.broadcast('gptchat-room.data', this.inputComment());
      });
    this.router.navigate([url]);
  }

  private getBaseUrl(): string {
    let role = 'participant';
    const assigned = this.assignedRole();
    if (assigned === 'Creator') {
      role = 'creator';
    } else if (assigned === 'Moderator') {
      role = 'moderator';
    }
    return `${role}/room/${room.value().shortId}/`;
  }
}
