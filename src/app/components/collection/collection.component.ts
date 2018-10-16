import { Component, OnInit } from '@angular/core';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit {

  constructor() { }


  collections: string[] = ['ARSnova', 'Angular', 'HTML', 'TypeScript' ];
  lastCollection: string;
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;

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

}
