import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

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
import {
  DocumentService,
  DomRefService,
  EventListenerService,
  JoyrideBackdropService,
  JoyrideDirective,
  JoyrideOptionsService,
  JoyrideService,
  JoyrideStepsContainerService,
  JoyrideStepService,
  LoggerService,
  StepDrawerService,
  TemplatesService
} from 'ngx-joyride';
import { RatingService } from '../../../services/http/rating.service';
import { RatingServiceMock } from '../../../services/mocks/rating.service.mock';
import { LoginComponent } from '../../shared/login/login.component';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { DB_CONFIG } from '../../../../indexeddb';
import { MatomoModule } from 'ngx-matomo-v9';


describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        HomePageComponent,
        NewLandingComponent,
        UserHomeComponent,
        LoginComponent,
      ],
      imports: [
        EssentialsModule,
        SharedModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        NgxIndexedDBModule.forRoot(DB_CONFIG),
        MatomoModule,
      ],
      providers: [
        LanguageService,
        AuthenticationService,
        DataStoreService,
        NotificationService,
        LanguageService,
        EventService,
        ModeratorService,
        RoomService,
        JoyrideService,
        JoyrideStepService,
        JoyrideBackdropService,
        DocumentService,
        DomRefService,
        JoyrideOptionsService,
        EventListenerService,
        JoyrideStepsContainerService,
        LoggerService,
        StepDrawerService,
        JoyrideDirective,
        TemplatesService,
        {
          provide: RatingService,
          useClass: RatingServiceMock,
        },
      ]
    }).compileComponents();
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

