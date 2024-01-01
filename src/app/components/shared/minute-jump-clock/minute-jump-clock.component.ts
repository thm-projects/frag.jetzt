import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HeaderService } from '../../../services/util/header.service';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../../../theme/theme.service';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { TimeoutHelper } from 'app/utils/ts-utils';

@Component({
  selector: 'app-minute-jump-clock',
  templateUrl: './minute-jump-clock.component.html',
  styleUrls: ['./minute-jump-clock.component.scss'],
})
export class MinuteJumpClockComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  minWidth: number = 1320;
  @Input()
  fixedSize: number = null;
  @Input()
  offsetTop: number = 0;
  @Input()
  offsetLeft: number = 0;
  @Input()
  zIndex: number = null;
  @Input()
  questionWallColor: boolean = false;
  @Input()
  withBackground: boolean = false;
  @Input()
  arcEnd: Date = null;
  @Input()
  arcDuration: number = 30;
  @Input()
  ignoreTooLessSpace = false;
  @ViewChild('clock')
  svgClock: ElementRef<HTMLElement>;
  visible: boolean = false;
  private _timer: TimeoutHelper = 0;
  private _initialized = false;
  private _destroyer = new Subject();
  private _matcher: MediaQueryList;

  constructor(
    private readonly headerService: HeaderService,
    private readonly deviceState: DeviceStateService,
    private readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this._matcher = window.matchMedia('(max-width: ' + this.minWidth + 'px)');
    const func = () => {
      this.update();
    };
    this.deviceState.mobile$.pipe(takeUntil(this._destroyer)).subscribe(func);
    this._matcher.addEventListener('change', func);
    this._destroyer.subscribe(() =>
      this._matcher.removeEventListener('change', func),
    );
    this.themeService
      .getTheme()
      .pipe(takeUntil(this._destroyer))
      .subscribe(func);
  }

  ngAfterViewInit() {
    this._initialized = true;
    this.setVariables();
    this.update();
  }

  ngOnDestroy() {
    this.unregister();
    this._destroyer.next(true);
    this._destroyer.complete();
  }

  calculateArc(): [string, string] {
    if (this.arcEnd === null) {
      return null;
    }
    const radius = 210;
    let startAngle;
    let endAngle;
    {
      let min = this.arcEnd.getMinutes();
      endAngle = (min * 360) / 60;
      min -= this.arcDuration;
      if (min < 0) {
        min = (min % 60) + 60;
      }
      startAngle = (min * 360) / 60;
      // transform origin
      endAngle -= 90;
      startAngle -= 90;
      if (endAngle < 0) {
        endAngle += 360;
      }
      if (startAngle < 0) {
        startAngle += 360;
      }
    }
    const diff = endAngle - startAngle + (endAngle < startAngle ? 360 : 0);
    let midAngle;
    {
      const start = this.arcEnd.getTime() - this.arcDuration * 60_000;
      const current = Date.now() - start;
      const duration = this.arcEnd.getTime() - start;
      const progress = Math.max(0, Math.min(current / duration, 1));
      midAngle = startAngle + diff * progress;
      midAngle = Math.trunc(midAngle * 4) / 4; // rasterize to 0.25
      if (midAngle > 360) {
        midAngle -= 360;
      }
    }
    const calculate = (r: number, angle: number) => {
      const rad = (angle * Math.PI) / 180;
      return [Math.cos(rad) * r, Math.sin(rad) * r];
    };
    const [startX, startY] = calculate(radius, startAngle);
    const [midX, midY] = calculate(radius, midAngle);
    const [endX, endY] = calculate(radius, endAngle);
    const diff1 = midAngle - startAngle + (midAngle < startAngle ? 360 : 0);
    const diff2 = endAngle - midAngle + (endAngle < midAngle ? 360 : 0);
    return [
      `M ${startX} ${startY} A ${radius} ${radius} 0 ${Number(
        diff1 > 180,
      )} 1 ${midX} ${midY}`,
      `M ${midX} ${midY} A ${radius} ${radius} 0 ${Number(
        diff2 > 180,
      )} 1 ${endX} ${endY}`,
    ];
  }

  private updatePresentationClock() {
    const date = new Date();
    const hr = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    const hrPosition = (hr * 360) / 12 + (min * 360) / 60 / 12;
    const minPosition = (min * 360) / 60;
    const secPosition = (sec * 360) / 60;
    this.svgClock.nativeElement
      .querySelectorAll('.hour')
      .forEach(
        (e) =>
          ((e as HTMLElement).style.transform =
            'rotate(' + hrPosition + 'deg)'),
      );
    this.svgClock.nativeElement
      .querySelectorAll('.minute')
      .forEach(
        (e) =>
          ((e as HTMLElement).style.transform =
            'rotate(' + minPosition + 'deg)'),
      );
    this.svgClock.nativeElement
      .querySelectorAll('.second')
      .forEach(
        (e) =>
          ((e as HTMLElement).style.transform =
            'rotate(' + secPosition + 'deg)'),
      );
  }

  private update() {
    this.visible =
      (this.ignoreTooLessSpace ||
        (!this.deviceState.isMobile() && !this._matcher.matches)) &&
      !this.deviceState.isSafari &&
      this.themeService.currentTheme?.key !== 'projector';
    if (!this._initialized) {
      return;
    }
    if (this.visible) {
      this.register();
    } else {
      this.unregister();
    }
  }

  private register() {
    if (this._timer !== 0) {
      return;
    }
    this.svgClock.nativeElement.style.display = '';
    this.headerService.getHeaderComponent().registerClock();
    this.updatePresentationClock();
    this._timer = setInterval(this.updatePresentationClock.bind(this), 1_000);
  }

  private unregister() {
    if (this._timer === 0) {
      return;
    }
    this.svgClock.nativeElement.style.display = 'none';
    this.headerService.getHeaderComponent().unregisterClock();
    clearInterval(this._timer);
    this._timer = 0;
  }

  private setVariables() {
    const style = this.svgClock.nativeElement.style;
    if (!this.visible) {
      style.display = 'none';
    }
    style.width = this.fixedSize
      ? this.fixedSize + 'px'
      : 'calc(100vw / 2 - 400px - 8px)';
    style.height = this.fixedSize ? this.fixedSize + 'px' : '100%';
    style.left = this.offsetLeft + 'px';
    style.top = this.offsetTop + 'px';
    if (this.zIndex !== null) {
      style.zIndex = String(this.zIndex);
    }
    if (this.questionWallColor) {
      style.setProperty('--second-color', 'white');
      style.setProperty('--accent-color', 'darkorange');
    }
  }
}
