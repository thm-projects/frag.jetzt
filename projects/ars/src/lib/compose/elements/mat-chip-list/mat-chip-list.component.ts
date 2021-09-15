import { Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_MENU_ITEM_DATA, ArsMatMenuItemConfig } from '../mat-menu-item/ars-mat-menu-item-config';
import { ARS_MAT_CHIP_LIST_CONFIG, ArsMatChipListConfig } from './mat-chip-list-config';
import { ArsAnchor } from '../../../models/util/ArsObserver';

@Component({
  selector: 'app-mat-chip-list',
  templateUrl: './mat-chip-list.component.html',
  styleUrls: ['./mat-chip-list.component.scss']
})
export class MatChipListComponent implements OnInit {

  elementAnchor:ArsAnchor<string[]>;

  constructor(
    @Inject(ARS_MAT_CHIP_LIST_CONFIG) public data:ArsMatChipListConfig
  ) { }

  ngOnInit(): void {
    this.elementAnchor=this.data.list.createAnchor();
  }

}
