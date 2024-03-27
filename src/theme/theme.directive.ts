import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { ThemeService } from './theme.service';
import { ReplaySubject, filter, takeUntil } from 'rxjs';

@Directive({
  selector: '[appTheme]',
})
export class ThemeDirective implements OnInit, OnDestroy {
  private destroyer = new ReplaySubject(1);
  private lastClass: string;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private themService: ThemeService,
  ) {}

  ngOnInit() {
    this.themService
      .getTheme()
      .pipe(
        takeUntil(this.destroyer),
        filter((v) => Boolean(v)),
      )
      .subscribe((theme) => {
        this.updateTheme(theme.key);
      });
  }

  updateTheme(themeName: string) {
    this.renderer.removeClass(this.elementRef.nativeElement, this.lastClass);
    this.renderer.addClass(this.elementRef.nativeElement, themeName);
    this.lastClass = themeName;
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
  }
}
