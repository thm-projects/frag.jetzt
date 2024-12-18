import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
import { FormControl, Validators } from '@angular/forms';
import { BrainstormingSession } from '../../../models/brainstorming-session';
import { SessionService } from '../../../services/util/session.service';
import { ForumComment } from '../../../utils/data-accessor';
import { UUID } from 'app/utils/ts-utils';
import { RoomStateService } from 'app/services/state/room-state.service';
import { dataService } from 'app/base/db/data-service';
import { room } from 'app/room/state/room';
import { user } from 'app/user/state/user';
import { toSignal } from '@angular/core/rxjs-interop';
import { KeycloakRoles } from 'app/models/user';
import {
  CreateCommentOptions,
  generateComment,
} from 'app/room/comment/util/create-comment';

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss'],
  standalone: false,
})
export class WriteCommentComponent {
  commentCreated = output<Comment | null>();
  allowEmpty = input(false);
  brainstormingData = input<BrainstormingSession>(null);
  commentReference = input<UUID>(null);
  canSelectTags = input(true);
  rewriteCommentData = input<ForumComment>(null);
  questionerNameEnabled = input(true);
  private readonly roomState = inject(RoomStateService);
  protected role = toSignal(this.roomState.assignedRole$, {
    initialValue: null,
  });
  protected maxCharacters = computed(() => {
    const role = this.role();
    if (!role) return 0;
    if (this.commentReference()) {
      return role !== 'Participant' ? 35_000 : 20_000;
    } else {
      return role !== 'Participant' ? 100_000 : 20_000;
    }
  });
  protected roleIcon = computed(() => {
    if (user()?.hasRole(KeycloakRoles.AdminDashboard)) {
      return 'admin_panel_settings';
    }
    const role = this.role();
    if (role === 'Creator') return 'co_present';
    if (role === 'Moderator') return 'support_agent';
    return 'person';
  });
  protected readonly tags = computed(() => room.value()?.tags ?? []);
  protected readonly i18n = i18n;
  data = signal('');
  isSubmittingComment = signal(false);
  selectedTag = signal<string | null>(null);
  // Grammarheck
  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  questionerNameFormControl = new FormControl('', [
    Validators.minLength(this.questionerNameMin),
    Validators.maxLength(this.questionerNameMax),
  ]);
  private injector = inject(Injector);
  private sessionService = inject(SessionService);
  private notification = inject(NotificationService);

  constructor() {
    effect((onCleanup) => {
      const rewrite = this.rewriteCommentData();
      if (rewrite) {
        this.questionerNameFormControl.setValue(rewrite.questionerName);
        this.questionerNameFormControl.disable();
        this.data.set(rewrite.body);
        this.selectedTag.set(
          this.tags().includes(rewrite.tag) ? rewrite.tag : null,
        );
        return;
      }
      this.questionerNameFormControl.setValue('');
      this.questionerNameFormControl.enable();
      this.selectedTag.set(null);
      const r = room.value();
      const u = user();
      if (!r || !u) return;

      const sub = dataService.localRoomSetting
        .get([r.id, u.id])
        .subscribe((data) => {
          this.questionerNameFormControl.setValue(data?.pseudonym ?? '');
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected createComment() {
    if (this.questionerNameEnabled()) {
      this.questionerNameFormControl.setValue(
        (this.questionerNameFormControl.value || '').trim(),
      );
      const errorMin = this.questionerNameFormControl.hasError('minlength');
      const errorMax = this.questionerNameFormControl.hasError('maxlength');
      if (errorMin || errorMax) {
        this.notification.show(i18n().questionerNameError);
        return;
      }
    }
    const body = this.data().trim();
    if (body.length <= 0 && !this.allowEmpty()) {
      this.notification.show(i18n().emptyComment);
      return;
    } else if (body.length > this.maxCharacters()) {
      this.notification.show(i18n().warning);
      return;
    }
    if (this.isSubmittingComment()) return;

    const options: CreateCommentOptions = {
      body: body,
      tag: this.selectedTag(),
      questionerName: this.questionerNameFormControl.value,
      brainstormingSession: this.brainstormingData(),
      selectedLanguage: 'AUTO' as Comment['language'],
      commentReference: this.commentReference(),
      injector: this.injector,
    };
    this.isSubmittingComment.set(true);
    generateComment(options).subscribe({
      next: (c) => {
        this.isSubmittingComment.set(false);
        localStorage.setItem('comment-created', String(true));
        this.commentCreated.emit(c);
      },
      error: () => {
        this.isSubmittingComment.set(false);
      },
    });
  }
}
