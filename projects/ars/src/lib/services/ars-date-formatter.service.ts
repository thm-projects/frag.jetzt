import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export enum ArsTimeUnit{
  YEAR,
  MONTH,
  WEEK,
  DAY,
  HOUR,
  MINUTE,
  SECOND
}

export const arsTimeTranslation = {
  de:{
    time:{
      year: "vor ? Jahr%en",
        month: "vor ? Monat%en",
        week: "vor ? Woche%n",
        day: "&1Gestern&#vor ? Tagen",
        hour: "vor ? Stunde%n",
        minute: "vor ? Minute%n",
        second: "&#vor kurzem"
    }
  },
  en:{
    time:{
      year: "? year%s ago",
      month: "? month%s ago",
      week: "? week%s",
      day: "&1Yesterday&#? days ago",
      hour: "? hour%s ago",
      minute: "? minute%s ago",
      second: "&#now"
    }
  }
}

export interface ArsApproximateDate {
  unit:ArsTimeUnit;
  time:number;
}

@Injectable({
  providedIn:'root'
})
export class ArsDateFormatter implements OnDestroy {

  constructor() {
  }

  ngOnDestroy(){
  }

  /**
   * return ArsApproximateDate
   * @param date:Date
   * @see Date
   * @see ArsApproximateDate
   * @see ArsTimeUnit
   */
  public approximateDate(date: Date): ArsApproximateDate {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if(interval > 1){
      return {
        unit:ArsTimeUnit.YEAR,
        time:Math.floor(interval)
      }
    }
    interval = seconds / 2592000;
    if(interval > 1){
      return {
        unit:ArsTimeUnit.MONTH,
        time:Math.floor(interval)
      }
    }
    interval = seconds / 86400;
    if(interval > 1){
      return {
        unit:ArsTimeUnit.DAY,
        time:Math.floor(interval)
      }
    }
    interval = seconds / 3600;
    if(interval > 1){
      return {
        unit:ArsTimeUnit.HOUR,
        time:Math.floor(interval)
      }
    }
    interval = seconds / 60;
    if(interval > 1){
      return {
        unit:ArsTimeUnit.MINUTE,
        time:Math.floor(interval)
      }
    }
    return {
      unit:ArsTimeUnit.SECOND,
      time:Math.floor(interval)
    }
  }

  /**
   * prettyPrints ArsApproximateDate
   * returns string
   * @param time: ArsApproximateDate
   * @param lang [en,de]
   */
  public format(time:ArsApproximateDate,lang:string):string{
    const text:string=arsTimeTranslation[lang]['time'][ArsTimeUnit[time.unit].toLocaleLowerCase()];
    if(text.includes('&')){
      const split=text.split('&');
      for(let i=0;i<split.length;i++){
        if(split[i].charAt(0)===time.time+''||split[i].charAt(0)==='#'){
          return split[i].substr(1).replace('?',time.time+'');
        }
      }
    }
    else {
      if(time.time==1){
        return text.split('%')[0].replace('?',time.time+'');
      }
      else{
        return text.replace('%','').replace('?',time.time+'');
      }
    }
  }

}
