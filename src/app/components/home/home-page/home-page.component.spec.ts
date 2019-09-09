/**
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePageComponent } from './home-page.component';
import { LanguageService } from '../../../services/util/language.service';
import { EssentialsModule } from '../../essentials/essentials.module';
import { NewLandingComponent } from '../new-landing/new-landing.component';
import { SharedModule } from '../../shared/shared.module';
import { AppRoutingModule } from '../../../app-routing.module';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ModeratorService } from '../../../services/http/moderator.service';
import { DataStoreService } from '../../../services/util/data-store.service';
import { NotificationService } from '../../../services/util/notification.service';
import { RoomService } from '../../../services/http/room.service';
import { EventService } from '../../../services/util/event.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserHomeComponent } from '../user-home/user-home.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomePageComponent,
                      NewLandingComponent,
                      UserHomeComponent ],
      imports: [
        EssentialsModule,
        SharedModule,
        AppRoutingModule,
        BrowserAnimationsModule
      ],
      providers: [
        LanguageService,
        AuthenticationService,
        DataStoreService,
        NotificationService,
        LanguageService,
        EventService,
        ModeratorService,
        RoomService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
**/
