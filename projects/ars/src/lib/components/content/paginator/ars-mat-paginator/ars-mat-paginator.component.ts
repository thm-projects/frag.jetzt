import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { RoomStateService } from 'app/services/state/room-state.service';
import { getInstant } from 'app/utils/ts-utils';

export interface ArsMatPaginatorTheme {
  buttonColor: string;
}

@Component({
    selector: 'ars-mat-paginator',
    templateUrl: './ars-mat-paginator.component.html',
    styleUrls: ['./ars-mat-paginator.component.scss'],
    standalone: false
})
export class ArsMatPaginatorComponent implements OnInit, OnDestroy {
  @Input() pageIndex: number;
  @Input() pageSize: number;
  @Input() disabled: boolean;
  @Input() pageSizeOptions: number[];
  @Input() length: number;
  @Input() hidePageSize: boolean;
  @Input() showFirstLastButtons: boolean;
  @Output() page: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  currentLang: string;
  private _destroyer = new ReplaySubject(1);
  private isPle = false;

  @Input() colors: ArsMatPaginatorTheme;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public appState: AppStateService,
    public http: HttpClient,
    public roomState: RoomStateService,
  ) {
    this.appState.language$
      .pipe(takeUntil(this._destroyer))
      .subscribe((lang) => {
        this.setLang(lang);
      });
    this.roomState.room$.pipe(takeUntil(this._destroyer)).subscribe((room) => {
      this.isPle = room?.mode === 'PLE';
      this.setLang(getInstant(this.appState.language$));
    });
  }

  setLang(lang: string) {
    if (!lang) {
      return;
    }
    this.currentLang = lang;
    this.http
      .get('/assets/i18n/ars-lib/' + this.currentLang + '.json')
      .subscribe((translation) => {
        const section = translation['paginator'];
        const paginatorIntl = new MatPaginatorIntl();
        paginatorIntl.itemsPerPageLabel = this.isPle
          ? section['ple']['itemsPerPageLabel']
          : section['itemsPerPageLabel'];
        paginatorIntl.nextPageLabel = section['nextPageLabel'];
        paginatorIntl.previousPageLabel = section['previousPageLabel'];
        paginatorIntl.firstPageLabel = section['firstPageLabel'];
        paginatorIntl.lastPageLabel = section['lastPageLabel'];
        paginatorIntl.getRangeLabel = this.createRangeLabel(translation);
        this.paginator._intl = paginatorIntl;
        this.paginator._changePageSize(this.pageSize);
      });
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this._destroyer.next(true);
    this._destroyer.complete();
  }

  private createRangeLabel(translation: any) {
    return (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return translation['paginator']['rangePageLabel1'];
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;
      return translation['paginator']['rangePageLabel2']
        .replace('%start', startIndex)
        .replace('%end', endIndex)
        .replace('%length', length);
    };
  }
}
