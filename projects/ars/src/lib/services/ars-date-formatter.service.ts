import { Injectable, OnDestroy } from '@angular/core';

export enum ArsTimeUnit{
  YEAR,
  MONTH,
  WEEK,
  DAY,
  HOUR,
  MINUTE,
  SECOND
}

interface ArsTimeTranslationProducer{
  (e:ArsApproximateDate):string;
}

// interface ArsTimeTranslationTemplate{
//   year:ArsTimeTranslationProducer;
//   month:ArsTimeTranslationProducer;
//   week:ArsTimeTranslationProducer;
//   day:ArsTimeTranslationProducer;
//   hour:ArsTimeTranslationProducer;
//   minute:ArsTimeTranslationProducer;
//   second:ArsTimeTranslationProducer;
// }

interface ArsTimeTranslationUtil{
}

interface ArsTimeTranslationRule{
  from:number;
  to:number;
  toString:(time: ArsTimeTranslationUtil)=>string;
}

interface ArsTimeTranslationBuilder{
  addRule(from:number,to:number,e:(time:ArsTimeTranslationUtil)=>string);
  toYear(n:number):number;
  toMonth(n:number):number;
  toWeek(n:number):number;
  toDay(n:number):number;
  toHour(n:number):number;
  toMinute(n:number):number;
  toSecond(n:number):number;
}

class ArsTimeTranslationFactory {
  public static build(e:(a:ArsTimeTranslationBuilder)=>void):ArsTimeTranslationRule[]{
    const rules:ArsTimeTranslationRule[]=[];
    e({
      addRule(from: number, to: number, e: (time: ArsTimeTranslationUtil) => string) {
        rules.push({
          from:from,
          to:to,
          toString:e
        })
      },
      toYear(n: number): number {
        return n*31556952;
      },
      toMonth(n: number): number {
        return n*2628000;
      },
      toWeek(n: number): number {
        return n*604800;
      },
      toDay(n: number): number {
        return n*86400;
      },
      toHour(n: number): number {
        return n*3600;
      },
      toMinute(n: number): number {
        return n*60;
      },
      toSecond(n: number): number {
        return n;
      }
    });
    return rules;
  }
}

ArsTimeTranslationFactory.build(e=>{
  e.addRule(e.toSecond(0),e.toSecond(30),a=>`recently`);
})

// const map:Map<string,ArsTimeTranslationTemplate>=new Map<string,ArsTimeTranslationTemplate>();

// interface ArsTranslationVisitor{
//   dayTranslation:string[];
//   monthTranslation:string[];
// }
//
// interface ArsTimeTranslationRuleSetTemplate{
//   year:string;
//   month:string;
//   day:string;
//   week:string;
//   hour:string;
//   minute:string;
//   second:string;
// }
//
// interface ArsTimeTranslationInnerTemplate extends ArsTranslationVisitor{
//   time:ArsTimeTranslationRuleSetTemplate;
//   timeConvert:(date:Date,visitor:ArsTranslationVisitor)=>string;
//   dateConvert:(date:Date,visitor:ArsTranslationVisitor)=>string;
// }
//
// interface ArsTimeTranslationTemplate{
//   de:ArsTimeTranslationInnerTemplate;
//   en:ArsTimeTranslationInnerTemplate;
// }
//


/**
 0s-30s vor kurzem
 30s-1m jetzt gerade
 10m-20m vor einer viertel Stunde
 20m-40m vor einer halben Stunde
 40m-60m vor einer Stunde
 1m-1m vor 1 Minute
 2m-60m vor x Minuten
 1h-1h vor einer Stunde
 2h-24h vor x Stunden
 1d-1d gestern um x Uhr
 2d-2d vorgestern um x Uhr
 1w-4w vor x Woche/n am TAG_NAME, TAG_NUMBER. MONAT_NAME um x Uhr
 1mo-12mo vor x Monaten am TAG_NAME, TAG_NUMBER. MONAT_NAME um x Uhr
 1y-12y vor x Monaten am TAG_NAME, TAG_NUMBER. MONAT_NAME um x Uhr

 0s-30s recently
 30s-1m just now
 10m-20m vor einer viertel Stunde
 20m-40m vor einer halben Stunde
 40m-60m vor einer Stunde
 1m-1m vor 1 Minute
 2m-60m vor x Minuten
 1h-1h vor einer Stunde
 2h-24h vor x Stunden
 1d-1d gestern um x Uhr
 2d-2d vorgestern um x Uhr
 1w-4w vor x Woche/n am TAG_NAME, TAG_NUMBER. MONAT_NAME um x Uhr
 1mo-12mo vor x Monaten am TAG_NAME, TAG_NUMBER. MONAT_NAME um x Uhr
 1y-12y vor x Monaten am TAG_NAME, TAG_NUMBER. MONAT_NAME um x Uhr
 */


// export const arsTimeTranslation:ArsTimeTranslationTemplate = {
//   de:{
//     time:{
//       year:
//         'vor ? Jahr%en am DATE um TIME',
//       month:
//         'vor ? Monat%en am DATE um TIME',
//       week:
//         'vor ? Woche%n am DATE um TIME',
//       day:
//         '&1:gestern um TIME;' +
//         '&2:vorgestern um TIME;' +
//         'vor ? Tag%en um TIME',
//       hour:
//         'vor ? Stunde%n',
//       minute:
//         '&10-20:vor einer viertel Stunde;' +
//         '&20-40:vor einer halben Stunde;' +
//         '&40-60:vor einer Stunde;' +
//         'vor ? Minute%n ',
//       second:
//         '&0-30:jetzt gerade;' +
//         'vor kurzem'
//     },
//     dayTranslation:[
//       'Montag',
//       'Dienstag',
//       'Mittwoch',
//       'Donnerstag',
//       'Freitag',
//       'Samstag',
//       'Sonntag'
//     ],
//     monthTranslation:[
//       'Januar',
//       'Februar',
//       'März',
//       'April',
//       'Mai',
//       'Juni',
//       'Juli',
//       'August',
//       'September',
//       'Oktober',
//       'November',
//       'Dezember'
//     ],
//     timeConvert:(date: Date,visitor:ArsTranslationVisitor) => date.toLocaleString('de-DE', {hour:'numeric', minute:'numeric', hour12:false}),
//     dateConvert:(date: Date,visitor:ArsTranslationVisitor) => date.getDate() + '. ' + visitor.monthTranslation[date.getMonth()]
//   },
//   en:{
//     time:{
//       year:
//         '? year%s ago on DATE TIME',
//       month:
//         '? month%s ago on DATE TIME',
//       week:
//         '? week%s ago on DATE TIME',
//       day:
//         '&1:yesterday at TIME;' +
//         '? days ago at TIME',
//       hour:
//         '? hour%s ago',
//       minute:
//         '&10-20:quarter of an hour ago;' +
//         '&20-40:half an hour ago;' +
//         '&40-60:1 hour ago;' +
//         '? minute%s ago',
//       second:
//         '&0-30:just now;' +
//         'recently'
//     },
//     monthTranslation:[
//       'January',
//       'February',
//       'March',
//       'April',
//       'May',
//       'June',
//       'July',
//       'August',
//       'September',
//       'October',
//       'November',
//       'December'
//     ],
//     dayTranslation:[
//       'Monday',
//       'Tuesday',
//       'Wednesday',
//       'Thursday',
//       'Friday',
//       'Saturday',
//       'Sunday'
//     ],
//     timeConvert:(date: Date,visitor:ArsTranslationVisitor) => {
//       let str=date.toLocaleString('en-US', {hour:'numeric', minute:'numeric', hour12:true});
//       if(str.split(':')[1].includes('00')){
//         str=str.replace(':00','');
//       }
//       return str;
//     },
//     dateConvert:(date: Date,visitor:ArsTranslationVisitor) => `Tuesday, March 22`
//   }
// };

export interface ArsApproximateDate{
  time: number;
  unit: ArsTimeUnit;
  date: Date;
}

export class ArsDateMap{

  private map: Map<string, (Map<ArsTimeUnit, ArsDateMapEntry[]>)>;

  constructor(){
    this.map = new Map<string, (Map<ArsTimeUnit, ArsDateMapEntry[]>)>();
    const cmap = () => {
      const map = new Map<ArsTimeUnit, ArsDateMapEntry[]>();
      Object.values(ArsTimeUnit)
      .forEach((e, i) =>
        map.set(i, []));
      return map;
    };
    ['en', 'de'].forEach(e => this.map.set(e, cmap()));
  }

  public add(lang: string, timeUnit: ArsTimeUnit, value: string){
    this.map.get(lang).get(timeUnit).push(new ArsDateMapEntry(value));
  }

  public format(i: ArsApproximateDate, lang: string): string{
    const list: ArsDateMapEntry[] = this.map.get(lang).get(i.unit);
    for (let x = 0; x < list.length; x++){
      if (list[x].test(i)){
        return list[x].text;
      }
    }
    return '';
  }

}

export class ArsDateMapEntry{

  public readonly test: (i: ArsApproximateDate) => boolean;
  public readonly text: string;

  constructor(str: string){
    const parse = e => e.includes('#')?-1:parseInt(e);
    if (str.includes(':')){
      const left = str.substring(1).split(':')[0];
      const right = str.substring(1).split(':')[1];
      if (left.includes('-')){
        const min = parse(left.split('-')[0]);
        const max = parse(left.split('-')[1]);
        this.test = i => i.time >= min && i.time <= max;
      }else{
        const value = parse(left);
        this.test = i => i.time == value;
      }
      this.text = right;
    }else{
      this.text = str;
      this.test = i => true;
    }
  }

}

@Injectable({
  providedIn:'root'
})
export class ArsDateFormatter implements OnDestroy{

  private map: ArsDateMap;

  constructor(){
    window['testDate']=(date)=>{
      const _date:Date=new Date(date);
      const _approximation=this.approximateDate(_date);
      const _translation_en=this.format(_approximation,'en');
      const _translation_de=this.format(_approximation,'de');
      console.log(_translation_de);
      console.log(_translation_en);
    };
    this.map = new ArsDateMap();
    // ['en', 'de'].forEach(lang => {
    //   for (let timeKey in arsTimeTranslation[lang].time){
    //     arsTimeTranslation[lang].time[timeKey].split(';').forEach(e => {
    //       if (e.length <= 0){
    //         return;
    //       }
    //       this.map.add(lang, ArsTimeUnit[timeKey.toUpperCase()], e);
    //     });
    //   }
    // });
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
  public approximateDate(date: Date): ArsApproximateDate{
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1){
      return {
        date:date,
        unit:ArsTimeUnit.YEAR,
        time:Math.floor(interval)
      };
    }
    interval = seconds / 2592000;
    if (interval > 1){
      return {
        date:date,
        unit:ArsTimeUnit.MONTH,
        time:Math.floor(interval)
      };
    }
    interval = seconds / 86400;
    if (interval > 1){
      return {
        date:date,
        unit:ArsTimeUnit.DAY,
        time:Math.floor(interval)
      };
    }
    interval = seconds / 3600;
    if (interval > 1){
      return {
        date:date,
        unit:ArsTimeUnit.HOUR,
        time:Math.floor(interval)
      };
    }
    interval = seconds / 60;
    if (interval > 1){
      return {
        date:date,
        unit:ArsTimeUnit.MINUTE,
        time:Math.floor(interval)
      };
    }
    return {
      date:date,
      unit:ArsTimeUnit.SECOND,
      time:Math.floor(interval)
    };
  }

  /**
   * prettyPrints ArsApproximateDate
   * returns string
   * @param time: ArsApproximateDate
   * @param lang [en,de]
   */
  public format(time: ArsApproximateDate, lang: string): string{
    // let str: string = this.map.format(time, lang);
    // if (str.includes('%')){
    //   str = str.replace('DATE', arsTimeTranslation[lang].dateConvert(time.date,arsTimeTranslation[lang]));
    //   str = str.replace('TIME', arsTimeTranslation[lang].timeConvert(time.date,arsTimeTranslation[lang]));
    //   if (time.time == 1){
    //     return (str.split('%')[0] + ((e: string) => e.substring(e.indexOf(' ')))(str.split('%')[1])).replace('?', time.time + '');
    //   }else{
    //     return str.replace('%', '').replace('?', time.time + '');
    //   }
    //
    // }
    // str = str.replace('DATE', arsTimeTranslation[lang].dateConvert(time.date));
    // str = str.replace('TIME', arsTimeTranslation[lang].timeConvert(time.date));
    // str = str.replace('?', time.time + '');
    // return str;
    return "DATE";
  }

}
