import {
  Directive,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { themes } from './arsnova-theme.const';
import { ThemeService } from './theme.service';
import { ReplaySubject, filter, takeUntil } from 'rxjs';

@Directive({
  selector: '[appTheme]',
})
export class ThemeDirective implements OnInit, OnDestroy {
  private destroyer = new ReplaySubject(1);

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
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
    const them = themes[themeName];
    for (const key of Object.keys(them)) {
      this.renderer.setProperty(this.elementRef.nativeElement, key, them[key]);
      this.document.body.style.setProperty(key, them[key]);
    }
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
  }
}
