import { Injectable } from '@angular/core';
import { M3NavigationTemplate } from '../../components/navigation/m3-navigation-types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class M3NavigationService {
  public readonly template: BehaviorSubject<M3NavigationTemplate | undefined> =
    new BehaviorSubject(undefined);

  emit(param: M3NavigationTemplate | undefined) {
    this.template.next(param);
  }
}
