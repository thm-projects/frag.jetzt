import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ArsApproximateDate, ArsDateFormatter} from "../../../services/ars-date-formatter.service";
import {ArsUtil} from "../../../models/util/ars-util";
import {ArsLifeCycleVisitor} from "../../../models/util/ars-life-cycle-visitor";
import {LanguageService} from "../../../../../../../src/app/services/util/language.service";

@Component({
  selector: 'ars-date-formatter',
  templateUrl: './date-formatter.component.html',
  styleUrls: ['./date-formatter.component.scss']
})
export class DateFormatterComponent extends ArsLifeCycleVisitor {

  @Input() date:any;
  @Input() updateInterval:number=1000;
  @Input() formatter:ArsDateFormatter;
  public _date:Date;
  public approximateDate:ArsApproximateDate;
  public translation:string;

  constructor(
    private languageService:LanguageService
  ) {
    super();
    this.onInit(()=>{
      this._date=new Date(this.date);
      this.onDestroy(ArsUtil.setInterval(()=>{
        this.approximateDate=this.formatter.approximateDate(this._date);
        this.translation=this.formatter.format(this.approximateDate,this.languageService.currentLanguage());
      },this.updateInterval,true));
    });
  }

}
