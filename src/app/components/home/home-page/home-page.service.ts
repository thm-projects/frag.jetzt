import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomePageService {
  private readonly _featureState: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private readonly _firstTimeVisitorKey = 'user-is-first-time-visitor';

  constructor() {}

  get featureState(): Observable<boolean> {
    return this._featureState.asObservable();
  }

  toggleFeatureState() {
    this._featureState.next(!this._featureState.value);
  }

  isFirstTimeVisitor(): boolean {
    if (!localStorage.getItem(this._firstTimeVisitorKey)) {
      localStorage.setItem(this._firstTimeVisitorKey, 'true');
      return true;
    }

    return false;
  }
}
