import { Component, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { MatDialog } from '@angular/material/dialog';
import { i18nContext } from 'app/base/i18n/i18n-context';
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-moderator-delete',
  templateUrl: './moderator-delete.component.html',
  styleUrls: ['./moderator-delete.component.scss'],
  standalone: false,
})
export class ModeratorDeleteComponent implements OnInit {
  loginId: string;
  protected readonly i18n = i18n;

  constructor(private liveAnnouncer: LiveAnnouncer) {}

  static open(dialog: MatDialog, loginId: string) {
    const ref = dialog.open(ModeratorDeleteComponent);
    ref.componentInstance.loginId = loginId;
    return ref;
  }

  ngOnInit() {
    this.liveAnnouncer.announce(
      i18nContext(i18n().reallyRemoveModerator, {
        loginId: this.loginId,
      }),
    );
  }
}
