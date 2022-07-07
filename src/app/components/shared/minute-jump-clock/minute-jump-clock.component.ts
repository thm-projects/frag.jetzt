import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-minute-jump-clock',
  templateUrl: './minute-jump-clock.component.html',
  styleUrls: ['./minute-jump-clock.component.scss']
})
export class MinuteJumpClockComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('clock')
  svgClock: ElementRef<HTMLElement>;
  private _timer;

  constructor() {
  }

  updatePresentationClock() {
    const date = new Date();
    const hr = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    const hrPosition = hr * 360 / 12 + ((min * 360 / 60) / 12);
    const minPosition = min * 360 / 60;
    const secPosition = sec * 360 / 60;
    this.svgClock.nativeElement.querySelectorAll('.hour')
      .forEach(e => (e as HTMLElement).style.transform = 'rotate(' + hrPosition + 'deg)');
    this.svgClock.nativeElement.querySelectorAll('.minute')
      .forEach(e => (e as HTMLElement).style.transform = 'rotate(' + minPosition + 'deg)');
    this.svgClock.nativeElement.querySelectorAll('.second')
      .forEach(e => (e as HTMLElement).style.transform = 'rotate(' + secPosition + 'deg)');
  }


  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.updatePresentationClock();
    this._timer = setInterval(this.updatePresentationClock.bind(this), 1_000);
  }

  ngOnDestroy() {
    clearInterval(this._timer);
  }

}
