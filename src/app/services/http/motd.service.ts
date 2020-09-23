import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Motd } from '../../models/motd';

@Injectable({
  providedIn: 'root'
})
export class MotdService {

  constructor() { }

  getPatch(): Observable<Motd> {
    const obs: Observable<Motd> = new Observable<Motd>(sub => {
      setTimeout(() => {
        sub.next(new Motd(
          '11',
          '### Neuer Motd \n\n Inhalt Inhalt Inhalt',
          new Date()
        ));
      }, 100);
    });
    return obs;
  }

}
