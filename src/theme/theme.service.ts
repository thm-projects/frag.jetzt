import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeName = localStorage.getItem('classNameOfTheme');
  private activeThem = new BehaviorSubject(this.themeName);

  constructor() { }

  public getActiveTheme() {
    return this.activeThem.asObservable();
  }

  public setActiveThem(name) {
    this.activeThem.next(name);
  }
}
