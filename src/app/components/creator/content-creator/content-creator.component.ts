import { Component, Inject, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../../shared/content-list/content-list.component';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-content-creator',
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {
  @Input() format;

  content: ContentText = new ContentText(
    '1',
    '1',
    '0',
    '',
    '',
    1,
    [],
  );
  collections: string[] = ['ARSnova', 'Angular', 'HTML', 'TypeScript'];
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  lastCollection: string;

  editDialogMode = false;

  constructor(public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.lastCollection = sessionStorage.getItem('collection');
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.collections.filter(collection => collection.toLowerCase().includes(filterValue));
  }

  resetInputs() {
    this.content.subject = '';
    this.content.body = '';
  }
}
