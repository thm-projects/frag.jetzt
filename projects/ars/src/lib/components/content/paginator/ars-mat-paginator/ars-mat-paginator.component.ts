import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { LanguageService } from '../../../../../../../../src/app/services/util/language.service';
import { HttpClient } from '@angular/common/http';

export interface ArsMatPaginatorTheme{
  buttonColor: string;
}

@Component({
  selector:'ars-mat-paginator',
  templateUrl:'./ars-mat-paginator.component.html',
  styleUrls:['./ars-mat-paginator.component.scss']
})
export class ArsMatPaginatorComponent implements OnInit{

  @Input() pageIndex: number;
  @Input() pageSize: number;
  @Input() disabled: boolean;
  @Input() pageSizeOptions: number[];
  @Input() length: number;
  @Input() hidePageSize: boolean;
  @Input() showFirstLastButtons: boolean;
  @Output() page: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  currentLang: string;

  @Input() colors: ArsMatPaginatorTheme;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public lang: LanguageService,
    public http: HttpClient
  ){
    this.lang.getLanguage().subscribe(lang => {
      this.setLang(lang);
    });
  }

  setLang(lang: string){
    this.currentLang = lang;
    this.http.get('/assets/i18n/ars-lib/' + this.currentLang + '.json').subscribe(translation => {
      const paginatorIntl = new MatPaginatorIntl();
      paginatorIntl.itemsPerPageLabel = translation['paginator']['itemsPerPageLabel'];
      paginatorIntl.nextPageLabel = translation['paginator']['nextPageLabel'];
      paginatorIntl.previousPageLabel = translation['paginator']['previousPageLabel'];
      paginatorIntl.firstPageLabel = translation['paginator']['firstPageLabel'];
      paginatorIntl.lastPageLabel = translation['paginator']['lastPageLabel'];
      paginatorIntl.getRangeLabel = this.createRangeLabel(translation);
      this.paginator._intl=paginatorIntl;
      this.paginator._changePageSize(this.pageSize);
    });
  }

  ngOnInit(): void{
  }

  private createRangeLabel(translation: any){
    return (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0){
        return translation['paginator']['rangePageLabel1'];
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length?Math.min(startIndex + pageSize, length):startIndex + pageSize;
      return translation['paginator']['rangePageLabel2']
        .replace('%start',startIndex)
        .replace("%end",endIndex)
        .replace("%length",length);
    };
  }

}
