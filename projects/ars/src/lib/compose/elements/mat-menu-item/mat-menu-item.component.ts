import { Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_MENU_ITEM_DATA, ArsMatMenuItemConfig } from './ars-mat-menu-item-config';

@Component({
  selector: 'ars-mat-menu-item',
  templateUrl: './mat-menu-item.component.html',
  styleUrls: ['./mat-menu-item.component.scss']
})
export class MatMenuItemComponent implements OnInit {

  constructor(
    @Inject(ARS_MAT_MENU_ITEM_DATA) public data:ArsMatMenuItemConfig
  ) { }

  ngOnInit(): void {
  }

}
