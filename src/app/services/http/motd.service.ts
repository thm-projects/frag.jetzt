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
          '111',
          '### Nostalgie oder Moderne? \n\n ![Da geht noch was](https://mobiles-wuppertal.org/fileadmin/user_upload/Wuppertal_O__PNV.jpg)',
          '### Nostalgie oder Moderne? \n\n ![Da geht noch was](https://mobiles-wuppertal.org/fileadmin/user_upload/Wuppertal_O__PNV.jpg)',
          new Date()
        ));
      }, 100);
    });
    return obs;
  }

}
