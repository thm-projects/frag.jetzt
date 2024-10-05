import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomePageService {
  private readonly _featureState: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private readonly _userHasVisitedBefore = 'userHasVisitedBefore';

  constructor() {}

  get featureState(): Observable<boolean> {
    return this._featureState.asObservable();
  }

  toggleFeatureState() {
    this._featureState.next(!this._featureState.value);
  }

  isFirstTimeVisitor(): boolean {
    if (!localStorage.getItem(this._userHasVisitedBefore)) {
      localStorage.setItem(this._userHasVisitedBefore, 'true');
      return true;
    }

    return false;
  }
}
