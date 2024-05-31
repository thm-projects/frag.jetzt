import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.loadModule(rawI18n);
import { Component, computed, effect, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppComponent } from 'app/app.component';
import { Room } from 'app/models/room';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import { FAB_BUTTON } from 'modules/navigation/m3-navigation-emitter';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { UserRole } from 'app/models/user-roles.enum';

@Component({
  selector: 'app-comment-list-fab',
  standalone: true,
  imports: [MatTooltipModule, MatIconModule, MatButtonModule],
  templateUrl: './comment-list-fab.component.html',
  styleUrl: './comment-list-fab.component.scss',
})
export class CommentListFabComponent {
  isCommentListEmpty = input.required<boolean>();
  commentsEnabled = input.required<boolean>();
  room = input.required<Room>();
  writeComment = input.required<() => void>();
  commentLength = input.required<number>();
  userRole = input.required<UserRole>();
  protected readonly i18n = i18n;
  protected readonly role = computed(() => {
    return this.userRole() > 0 ? 'creator' : 'participant';
  });
  protected readonly classes = computed(() => {
    if (!this.commentsEnabled() || this.isCommentListEmpty()) {
      return '';
    }
    return windowWatcher.windowState() === M3WindowSizeClass.Compact
      ? 'mobile'
      : 'desktop';
  });
  protected readonly starting = signal(true);

  constructor() {
    effect(
      (cleanup) => {
        if (
          !this.commentsEnabled() ||
          this.isCommentListEmpty() ||
          this.starting()
        ) {
          return;
        }
        FAB_BUTTON.set({
          icon: 'add',
          title: this.room()?.mode === 'PLE' ? i18n().ple.write : i18n().write,
          onClick: () => {
            this.writeComment()();
            return false;
          },
        });
        cleanup(() => {
          FAB_BUTTON.set(null);
        });
      },
      { allowSignalWrites: true },
    );
  }

  protected isScrollButtonVisible(): boolean {
    return !AppComponent.isScrolledTop() && this.commentLength() > 10;
  }

  protected scrollTop() {
    return AppComponent.scrollTop();
  }
}
