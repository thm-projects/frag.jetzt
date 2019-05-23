import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeName = localStorage.getItem('theme');
  private activeThem = new BehaviorSubject(this.themeName);

  constructor() { }

  public getTheme() {
    return this.activeThem.asObservable();
  }

  public activate(name) {
    this.activeThem.next(name);
    localStorage.setItem('theme', name);
  }
}
