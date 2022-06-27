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

export const arsTimeTranslation = {
  de:{
    time:{
      year:
        '&1:letztes Jahr DATE;' +
        'vor ? Jahr%en DATE',
      month:
        '&1:letzten Monat;' +
        'vor ? Monat%en DATE',
      week:
        '&1:letzte Woche;' +
        'vor ? Woche%n DATE',
      day:
        '&1:gestern TIME;' +
        '&2:vorgestern TIME;' +
        'vor ? Tag%en TIME',
      hour:
        'vor ? Stunde%n',
      minute:
        '&10-20:vor einer viertel Stunde;' +
        '&20-40:vor einer halben Stunde;' +
        '&40-60:vor einer Stunde;' +
        'vor ? Minute%n ',
      second:
        '&0-30:jetzt gerade;' +
        'vor kurzem'
    },
    dayTranslation:[
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag'
    ],
    monthTranslation:[
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember'
    ],
    timeConvert:(date: Date) => 'um '+(date.toLocaleString('de-DE', {hour:'numeric', minute:'numeric', hour12:false}).replace(/^0/gm,'')),
    dateConvert:(date: Date) => `am ${arsTimeTranslation.de.dayTranslation[date.getDay()-1]}, ${date.getDate()}. ${arsTimeTranslation.de.monthTranslation[date.getMonth()]} ${date.getFullYear()}`,
  },
  en:{
    time:{
      year:
        '&1:last year DATE;' +
        '? year%s ago DATE',
      month:
        '&1:last month DATE;' +
        '? month%s ago DATE',
      week:
        '&1:last week DATE;' +
        '? week%s ago DATE',
      day:
        '&1:yesterday TIME;' +
        '? days ago TIME',
      hour:
        '? hour%s ago',
      minute:
        '&10-20:quarter of an hour ago;' +
        '&20-40:half an hour ago;' +
        '&40-60:1 hour ago;' +
        '? minute%s ago',
      second:
        '&0-30:just now;' +
        'recently'
    },
    monthTranslation:[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    dayTranslation:[
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ],
    timeConvert:(date: Date) => 'at '+date.toLocaleString('en-US', {hour:'numeric', minute:'numeric', hour12:true}),
    dateConvert:(date: Date) => `on ${arsTimeTranslation.en.dayTranslation[date.getDay()-1]}, ${arsTimeTranslation.en.monthTranslation[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
  }
};

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
    this.map = new ArsDateMap();
    ['en', 'de'].forEach(lang => {
      for (let timeKey in arsTimeTranslation[lang].time){
        arsTimeTranslation[lang].time[timeKey].split(';').forEach(e => {
          if (e.length <= 0){
            return;
          }
          this.map.add(lang, ArsTimeUnit[timeKey.toUpperCase()], e);
        });
      }
    });
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
    let str: string = this.map.format(time, lang);
    if (str.includes('%')){
      str = str.replace('DATE', arsTimeTranslation[lang].dateConvert(time.date));
      str = str.replace('TIME', arsTimeTranslation[lang].timeConvert(time.date));
      if (time.time == 1){
        return (str.split('%')[0] + ((e: string) => e.substring(e.indexOf(' ')))(str.split('%')[1])).replace('?', time.time + '');
      }else{
        return str.replace('%', '').replace('?', time.time + '');
      }

    }
    str = str.replace('DATE', arsTimeTranslation[lang].dateConvert(time.date));
    str = str.replace('TIME', arsTimeTranslation[lang].timeConvert(time.date));
    str = str.replace('?', time.time + '');
    return str;
  }

}
