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
          '### Neuer Patch \n\n Inhalt Inhalt Inhalt',
          new Date()
        ));
      }, 100);
    });
    return obs;
  }

}
