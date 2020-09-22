import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patch } from '../../models/patch';

@Injectable({
  providedIn: 'root'
})
export class PatchService {

  constructor() { }

  getPatch(): Observable<Patch> {
    const obs: Observable<Patch> = new Observable<Patch>(sub => {
      setTimeout(() => {
        sub.next(new Patch(
          '1',
          '### Nostalgie oder Moderne? \n\n ![Da geht noch was](https://mobiles-wuppertal.org/fileadmin/user_upload/Wuppertal_O__PNV.jpg)',
          new Date()
        ));
      }, 100);
    });
    return obs;
  }

}
