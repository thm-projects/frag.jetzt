import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quiz-now',
  templateUrl: './quiz-now.component.html',
  styleUrls: ['./quiz-now.component.scss']
})
export class QuizNowComponent implements OnInit, OnDestroy {
  urlSafe: SafeResourceUrl;
  isLoading = true;
  shortId: string;
  roleString: string;
  private _headerSubscription;

  constructor(public sanitizer: DomSanitizer,
              private router: Router,
              private eventService: EventService) {
    this.shortId = localStorage.getItem('shortId');
    const access = (JSON.parse(localStorage.getItem('ROOM_ACCESS')) || []) as string[];
    const roomAccess = access.find(e => e.endsWith('_' + this.shortId)) || '0_' + this.shortId;
    const role = parseInt(roomAccess.substr(0, 1), 10);
    if (role === 3) {
      this.roleString = 'creator';
    } else if (role > 0) {
      this.roleString = 'moderator';
    } else {
      this.roleString = 'participant';
    }
  }

  ngOnInit() {
    this.initURL();
    this._headerSubscription = this.eventService.on<string>('navigate').subscribe(action => {
      if (action === 'questionBoard') {
        this.router.navigate(['/' + this.roleString + '/room/' + this.shortId + '/comments']);
      }
    });
  }

  ngOnDestroy() {
    this._headerSubscription.unsubscribe();
  }

  private initURL() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.responseURL) {
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(xhr.responseURL);
        xhr.abort();
      }
    };
    xhr.open('OPTIONS', '/antworte-jetzt');
    xhr.send();
  }
}
