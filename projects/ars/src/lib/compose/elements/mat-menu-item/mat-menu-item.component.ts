import { Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_MENU_ITEM_DATA, ArsMatMenuItemConfig } from './ars-mat-menu-item-config';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
    selector: 'ars-mat-menu-item',
    templateUrl: './mat-menu-item.component.html',
    styleUrls: ['./mat-menu-item.component.scss'],
    standalone: false
})
export class MatMenuItemComponent implements OnInit{

  public translate: TranslateService;

  constructor(
    public router: Router,
    @Inject(ARS_MAT_MENU_ITEM_DATA) public data: ArsMatMenuItemConfig
  ){
    this.translate = data.translate;
  }

  ngOnInit(): void{
  }

  public action(e: MouseEvent){
    if (this.data.callback){
      this.data.callback(e);
    }
    if (this.data.routerLink){
      this.router.navigateByUrl(this.data.routerLink);
    }
  }

}
