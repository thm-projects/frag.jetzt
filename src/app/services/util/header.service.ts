import { Injectable } from '@angular/core';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { ArsComposeHostDirective } from '../../../../projects/ars/src/lib/compose/ars-compose-host.directive';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  private userActivity: string;
  private userActivityListener: ((v: string) => void)[] = [];
  private userActivityToggle: boolean;
  private userActivityToggleListener: ((v: boolean) => void)[] = [];
  private headerComponent: () => HeaderComponent;

  constructor() {
  }

  public getHeaderComponent(): HeaderComponent {
    return this.headerComponent();
  }

  public initHeader(headerComponent: () => HeaderComponent) {
    this.headerComponent = headerComponent;
  }

  public setCurrentUserActivity(e: string) {
    if (this.userActivity === e) {
      return;
    }
    this.userActivity = e;
    this.userActivityListener.forEach(f => f(this.userActivity));
  }

  public toggleCurrentUserActivity(e: boolean) {
    if (this.userActivityToggle === e) {
      return;
    }
    this.userActivityToggle = e;
    this.userActivityToggleListener.forEach(f => f(this.userActivityToggle));
  }

  public onUserChange(f: (v: string) => void) {
    this.userActivityListener.push(f);
  }

  public onActivityChange(f: (v: boolean) => void) {
    this.userActivityToggleListener.push(f);
  }

  public getTranslate(): TranslateService {
    return this.headerComponent().translationService;
  }

  public getNotificationService(): NotificationService {
    return this.headerComponent().notificationService;
  }

  public getHost(): ArsComposeHostDirective {
    return this.headerComponent().host;
  }

}
