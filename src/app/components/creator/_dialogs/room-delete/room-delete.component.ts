import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, input, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { ContextPipe } from 'app/base/i18n/context.pipe';

@Component({
  selector: 'app-room-delete',
  templateUrl: './room-delete.component.html',
  styleUrls: ['./room-delete.component.scss'],
  imports: [
    MatDialogModule,
    MatButtonModule,
    CustomMarkdownModule,
    ContextPipe,
  ],
})
export class RoomDeleteComponent implements OnInit {
  name = input.required<string>();
  protected readonly i18n = i18n;

  constructor(private liveAnnouncer: LiveAnnouncer) {}

  static open(dialog: MatDialog, name: string) {
    const ref = dialog.open(RoomDeleteComponent);
    ref.componentRef.setInput('name', name);
    return ref;
  }

  ngOnInit() {
    this.liveAnnouncer.announce(
      i18nContext(i18n().description, { name: this.name() }),
    );
  }
}
