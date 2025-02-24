import { Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_CHIP_LIST_CONFIG, ArsMatChipConfig, ArsMatChipListConfig } from './mat-chip-list-config';
import { ArsAnchor } from '../../../models/util/ars-observer';

@Component({
    selector: 'app-mat-chip-list',
    templateUrl: './mat-chip-list.component.html',
    styleUrls: ['./mat-chip-list.component.scss'],
    standalone: false
})
export class MatChipListComponent implements OnInit{

  elementAnchor: ArsAnchor<ArsMatChipConfig[]>;

  constructor(
    @Inject(ARS_MAT_CHIP_LIST_CONFIG) public data: ArsMatChipListConfig
  ){
  }

  ngOnInit(): void{
    this.elementAnchor = this.data.list.createAnchor();
  }

  select(chip: ArsMatChipConfig){
    chip.onSelect(chip);
    if (this.data.onSelect){
      this.data.onSelect(this.data.list);
    }
  }

}
