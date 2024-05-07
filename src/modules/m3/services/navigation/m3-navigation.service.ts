import { Injectable } from '@angular/core';
import { M3NavigationTemplate } from '../../components/navigation/m3-navigation-types';
import { BehaviorSubject } from 'rxjs';

export interface M3NavigationTemplateEmitter {
  m3NavigationTemplate: M3NavigationTemplate;
}

@Injectable({
  providedIn: 'root',
})
export class M3NavigationService {
  public readonly template: BehaviorSubject<M3NavigationTemplate | undefined> =
    new BehaviorSubject(undefined);

  emit(param: M3NavigationTemplate | M3NavigationTemplateEmitter | undefined) {
    if (param.hasOwnProperty('kind')) {
      this.template.next(param as M3NavigationTemplate);
    } else {
      this.template.next(
        (param as M3NavigationTemplateEmitter).m3NavigationTemplate,
      );
    }
  }
}
