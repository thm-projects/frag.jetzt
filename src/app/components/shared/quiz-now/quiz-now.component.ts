import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';
import { SessionService } from '../../../services/util/session.service';
import { DBRoomAccessService } from '../../../services/persistence/dbroom-access.service';
import { UserManagementService } from '../../../services/util/user-management.service';
import { UserRole } from '../../../models/user-roles.enum';
import { DsgvoBuilder } from '../../../utils/dsgvo-builder';

@Component({
  selector: 'app-quiz-now',
  templateUrl: './quiz-now.component.html',
  styleUrls: ['./quiz-now.component.scss']
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
    private dbRoomAccess: DBRoomAccessService,
    private userManagementService: UserManagementService,
  ) {
    this.shortId = this.sessionService.getLastShortId();
    const id = this.userManagementService.getCurrentUser()?.id;
    if (!id) {
      this.roleString = 'participant';
      return;
    }
    this.dbRoomAccess.getByUserAndShortId(id, this.shortId).subscribe(access => {
      if (access.role === UserRole.CREATOR) {
        this.roleString = 'creator';
      } else if (access.role > UserRole.PARTICIPANT) {
        this.roleString = 'moderator';
      } else {
        this.roleString = 'participant';
      }
    });
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
        DsgvoBuilder.trustURL(xhr.responseURL);
        this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(xhr.responseURL);
        this.isURLLoading = false;
        xhr.abort();
      }
    };
    xhr.open('OPTIONS', '/antworte-jetzt');
    xhr.send();
  }
}
