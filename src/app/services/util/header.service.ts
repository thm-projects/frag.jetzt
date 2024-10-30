import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private userActivity: string;
  private userActivityListener: ((v: string) => void)[] = [];
  private userActivityToggle: boolean;
  private userActivityToggleListener: ((v: boolean) => void)[] = [];
  private readonly _isActive: BehaviorSubject<boolean> = new BehaviorSubject(
    false,
  );

  public setCurrentUserActivity(e: string) {
    if (this.userActivity === e) {
      return;
    }
    this.userActivity = e;
    this.userActivityListener.forEach((f) => f(this.userActivity));
  }

  public getCurrentUserActivity() {
    return this.userActivity;
  }

  public toggleCurrentUserActivity(e: boolean) {
    if (this.userActivityToggle === e) {
      return;
    }
    this.userActivityToggle = e;
    this.userActivityToggleListener.forEach((f) => f(this.userActivityToggle));
  }

  public isToggleCurrentUserActivity() {
    return this.userActivityToggle;
  }

  public onUserChange(f: (v: string) => void) {
    this.userActivityListener.push(f);
  }

  public onActivityChange(f: (v: boolean) => void) {
    this.userActivityToggleListener.push(f);
  }

  set isActive(value: boolean) {
    this._isActive.next(value);
  }

  get isActive() {
    return this._isActive.value;
  }
}
