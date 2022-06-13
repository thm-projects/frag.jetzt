import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NotificationService } from '../../../services/util/notification.service';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-app-rating',
  templateUrl: './app-rating.component.html',
  styleUrls: ['./app-rating.component.scss']
})
export class AppRatingComponent implements OnInit {

  @ViewChildren(MatIcon) children: QueryList<MatIcon>;
  private isSaving = false;
  private visibleRating = 0;
  private listeningToMove = true;

  constructor(
    private languageService: LanguageService,
    private notificationService: NotificationService,
  ) {
    this.visibleRating = Number(localStorage.getItem('rating') || 0);
  }

  getIcon(index: number) {
    if (this.visibleRating >= index + 1) {
      return 'star';
    }
    return this.visibleRating > index ? 'star_half' : 'star_border';
  }

  ngOnInit(): void {
  }

  onClick(index: number, event: MouseEvent) {
    const elem = this.children.get(index)._elementRef.nativeElement;
    if (this.listeningToMove || this.visibleRating < index || this.visibleRating > index + 1) {
      this.listeningToMove = false;
      const x = Math.trunc(event.offsetX / (elem.clientWidth / 3));
      this.visibleRating = index + x / 2;
    } else {
      this.visibleRating += 0.5;
      if (this.visibleRating > index + 1) {
        this.visibleRating = index;
      }
    }
    elem.classList.add('bounce');
    elem.addEventListener('animationend', () => {
      elem.classList.remove('bounce');
    }, { once: true });
  }

  onMouseMove(index: number, event: MouseEvent) {
    if (!this.listeningToMove) {
      return;
    }
    const elem = this.children.get(index)._elementRef.nativeElement;
    const x = Math.trunc(event.offsetX / (elem.clientWidth / 3));
    this.visibleRating = index + x / 2;
  }

  onMouseLeave() {
    this.listeningToMove = true;
  }

  save() {
    if (this.isSaving) {
      this.notificationService.show('Fehler!');
      return;
    }
    this.isSaving = true;
    localStorage.setItem('rating', String(this.visibleRating));
    this.notificationService.show('Danke für deine Bewertung!');
  }

}
