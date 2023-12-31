import { AfterViewInit, Component, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-question-wall-intro',
  templateUrl: './question-wall-intro.component.html',
  styleUrls: ['./question-wall-intro.component.scss'],
})
export class QuestionWallIntroComponent implements AfterViewInit {
  resolved: boolean = false;

  constructor(private r: Renderer2, private ref: ElementRef) {}

  ngAfterViewInit() {
    this.backgroundAnimation();
    this.particleAnimation();
    setTimeout(() => {
      const background =
        this.ref.nativeElement.getElementsByClassName('background')[0];
      const screen = this.ref.nativeElement.getElementsByClassName('screen')[0];
      background.style.opacity = 0;
      setTimeout(() => {
        screen.style.display = 'none';
        setTimeout(() => {
          this.resolved = true;
        }, 0);
      }, 0);
    }, 0);
  }

  toArray(str: string): string[] {
    return Object.assign([], str.split(''));
  }

  private backgroundAnimation() {
    const background: HTMLElement =
      this.ref.nativeElement.getElementsByClassName('background')[0];
    background.style.transition = 'all 5s ease-in-out, opacity 3s ease-in-out';
    setTimeout(() => {
      background.style.filter = 'grayscale(1) brightness(1)';
    }, 0);
  }

  private particleAnimation() {
    const container =
      this.ref.nativeElement.getElementsByClassName('particle-container')[0];
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const toCompX = (x) => x * (width / 2) + width / 2 + 'px';
    const toCompY = (y) => y * (height / 2) + height / 2 + 'px';
    const particleList: HTMLElement[] = Array.from(
      container.getElementsByClassName('particle-element'),
    );
    particleList.forEach((e) => {
      e.style.transform = 'translate(' + toCompX(0) + ',' + toCompY(0) + ')';
    });
    setTimeout(() => {
      particleList.forEach((e) => {
        e.style.transition =
          'transform 0.9s ease, opacity ' + Math.random() * 0.9 + 's ease';
      });
    }, 0);
    const random = () => Math.random() * 2 - 1;
    setTimeout(() => {
      particleList.forEach((e) => {
        e.style.transform =
          'translate(' +
          toCompX(random()) +
          ',' +
          toCompY(random()) +
          ') rotate(' +
          Math.random() * 50 +
          'deg)';
        e.style.width = 10 + 'px';
        e.style.height = 10 + 'px';
      });
    }, 0);
    setTimeout(() => {
      particleList.forEach((e) => {
        e.style.opacity = '0';
      });
    }, 0);
  }
}
