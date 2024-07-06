import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';
import { SessionService } from '../../../services/util/session.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { filter, take } from 'rxjs';
import { gdprWatcher } from 'app/base/gdpr/gdpr-watcher';
import { user } from 'app/user/state/user';

@Component({
  selector: 'app-quiz-now',
  templateUrl: './quiz-now.component.html',
  styleUrls: ['./quiz-now.component.scss'],
})
export class QuizNowComponent implements OnInit, OnDestroy {
  urlSafe: SafeResourceUrl;
  isLoading = true;
  isURLLoading = true;
  shortId: string;
  roleString: string;
  private _headerSubscription;

  constructor(
    public sanitizer: DomSanitizer,
    private router: Router,
    private eventService: EventService,
    private sessionService: SessionService,
    private accountState: AccountStateService,
  ) {
    this.shortId = this.sessionService.getLastShortId();
    const id = user()?.id;
    if (!id) {
      this.roleString = 'participant';
      return;
    }
    this.accountState.access$
      .pipe(
        filter((v) => Boolean(v)),
        take(1),
      )
      .subscribe((accesses) => {
        const access = accesses.find(
          (a) => a.roomShortId === this.shortId && a.userId === id,
        );
        if (!access) {
          this.roleString = 'participant';
          return;
        }
        if (access.role === 'Creator') {
          this.roleString = 'creator';
        } else if (access.role === 'Moderator') {
          this.roleString = 'moderator';
        } else {
          this.roleString = 'participant';
        }
      });
  }

  ngOnInit() {
    this.initURL();
    this._headerSubscription = this.eventService
      .on<string>('navigate')
      .subscribe((action) => {
        if (action === 'questionBoard') {
          this.router.navigate([
            '/' + this.roleString + '/room/' + this.shortId + '/comments',
          ]);
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
        gdprWatcher.trustDomain(xhr.responseURL);
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
          xhr.responseURL,
        );
        this.isURLLoading = false;
        xhr.abort();
      }
    };
    xhr.open('OPTIONS', '/antworte-jetzt');
    xhr.send();
  }
}
