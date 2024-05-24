import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomePageService {
  private readonly _featureState: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  constructor() {}

  get featureState(): Observable<boolean> {
    return this._featureState.asObservable();
  }

  toggleFeatureState() {
    this._featureState.next(!this._featureState.value);
  }
}
