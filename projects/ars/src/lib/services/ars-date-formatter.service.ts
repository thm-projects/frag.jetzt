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

enum ArsTimeSecConversion {
  YEAR = 31536000,
  MONTH = 2592000,
  DAY = 86400,
  HOUR = 3600,
  MINUTE = 60,
  SECOND = 1
}

export const arsTimeTranslation = {
  de:{
    time:{
      year:
        '&1:letztes Jahr DATE;' +
        'vor ? Jahr%en DATE',
      month:
        '&1:letzten Monat DATE;' +
        'vor ? Monat%en DATE',
      week:
        '&1:letzte Woche DATE;' +
        'vor ? Woche%n DATE',
      day:
        '&1:gestern TIME;' +
        '&2:vorgestern TIME;' +
        'vor ? Tag%en DATE',
      hour:
        'vor ? Stunde%n TIME',
      minute:
        '&15-20:vor einer viertel Stunde;' +
        '&30-35:vor einer halben Stunde;' +
        '&55-60:vor etwa einer Stunde;' +
        'vor ? Minute%n ',
      second:
        '&0-30:jetzt gerade;' +
        'vor kurzem'
    },
    dayTranslation:[
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag'
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
    dateConvert:(date: Date) => `am ${arsTimeTranslation.de.dayTranslation[date.getDay()]}, ${date.getDate()}. ${arsTimeTranslation.de.monthTranslation[date.getMonth()]} ${date.getFullYear()}`,
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
        '&2:day before yesterday TIME;' +
        '? days ago DATE',
      hour:
        '? hour%s ago TIME',
      minute:
        '&15-20:quarter of an hour ago;' +
        '&30-35:half an hour ago;' +
        '&55-60:about an hour ago;' +
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
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ],
    timeConvert:(date: Date) => 'at '+date.toLocaleString('en-US', {hour:'numeric', minute:'numeric', hour12:true}),
    dateConvert:(date: Date) => `on ${arsTimeTranslation.en.dayTranslation[date.getDay()]}, ${arsTimeTranslation.en.monthTranslation[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
  },
  fr:{
    time:{
      year :
        '&1:dernière année DATE;' +
        'avant ? année%s DATE',
      month :
        '&1:dernier mois DATE;' +
        'avant ? mois% DATE',
      week :
        '&1:dernière semaine DATE;' +
        'avant ? semaine%s DATE',
      day :
        '&1:hier TIME;' +
        '&2:avant-hier TIME;' +
        'avant ? jour%s DATE',
      hour :
        'avant ? heure%s TIME',
      minute :
        '&15-20:il y a un quart d\'heure;' +
      '&30-35:il y a une demi-heure;' +
          '&55-60:il y a environ une heure;' +
        'avant ? minute%s ',
      second :
        '&0-30:en ce moment;' +
        'il y a peu'
    },
    dayTranslation :[
      'dimanche',
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi'
    ],
    monthTranslation :[
      'janvier',
      'février',
      'mars',
      'avril',
      'Mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre'
    ],
    timeConvert:(date: Date) => 'à '+date.toLocaleString('fr-FR', {hour:'numeric', minute:'numeric', hour12:false}),
    dateConvert:(date: Date) => 'le ' + date.toLocaleString('fr', {weekday: 'long', year: 'numeric', month: 'long', day: '2-digit'}) ,
  },

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
    ['en', 'de', 'fr'].forEach(e => this.map.set(e, cmap()));
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

enum Token{
  DATE='DATE',
  FORM='%',
  VAL='?',
  TIME='TIME'
}

@Injectable({
  providedIn:'root'
})
export class ArsDateFormatter implements OnDestroy{

  public static DEBUG: boolean=false;

  private map: ArsDateMap;

  constructor(){
    this.map = new ArsDateMap();
    ['en', 'de', 'fr'].forEach(lang => {
      for (let timeKey in arsTimeTranslation[lang].time){
        arsTimeTranslation[lang].time[timeKey].split(';').forEach(e => {
          if (e.length <= 0){
            return;
          }
          this.map.add(lang, ArsTimeUnit[timeKey.toUpperCase()], e);
        });
      }
    });
    if(ArsDateFormatter.DEBUG){
      console.error('ArsDateFormatter.DEBUG active!');
      window['ars']={};
      window['ars']['formatDate']=(date:Date)=>{
        const approx=this.approximateDate(date);
        console.log(approx);
        console.log(this.format(approx,'de'));
        console.log(this.format(approx,'en'));
        console.log(this.format(approx,'fr'));
      };
    }
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
    const s = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const toTime = b => Math.round(s / b);
    const test = ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND']
      .map<[string, number]>(x => [x, toTime(ArsTimeSecConversion[x])])
      .filter(x => x[1] > 0)
      .sort((a, b) => a[1] - b[1]);
    if (!test || !test.length) {
      return {
        date: date,
        unit: -1,
        time: -1
      }
    }
    return {
      date: date,
      unit: ArsTimeUnit[test[0][0]],
      time: test[0][1]
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
    if (str.includes(Token.FORM)){
      str = str.replace(Token.DATE, arsTimeTranslation[lang].dateConvert(time.date));
      str = str.replace(Token.TIME, arsTimeTranslation[lang].timeConvert(time.date));
      if (time.time == 1){
        return (str.split(Token.FORM)[0] + ((e: string) => e.substring(e.indexOf(' ')))(str.split(Token.FORM)[1])).replace(Token.VAL, time.time + '');
      }else{
        return str.replace(Token.FORM, '').replace(Token.VAL, time.time + '');
      }

    }
    str = str.replace(Token.DATE, arsTimeTranslation[lang].dateConvert(time.date));
    str = str.replace(Token.TIME, arsTimeTranslation[lang].timeConvert(time.date));
    str = str.replace(Token.VAL, time.time + '');
    return str;
  }

}
