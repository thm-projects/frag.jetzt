import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserBonusTokenComponent } from './user-bonus-token.component';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { RoomService } from '../../../../services/http/room.service';
import { CommentService } from '../../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { BonusTokenUtilService } from '../../../../services/util/bonus-token-util.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { of } from 'rxjs';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Room } from '../../../../models/room';
import { BonusToken } from '../../../../models/bonus-token';
import { Comment } from '../../../../models/comment';
import { Clipboard } from '@angular/cdk/clipboard';
import { ModeratorService } from '../../../../services/http/moderator.service';

// Simple mock translate pipe
@Pipe({
  name: 'translate',
  standalone: false,
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('UserBonusTokenComponent', () => {
  let component: UserBonusTokenComponent;
  let fixture: ComponentFixture<UserBonusTokenComponent>;

  // Spies
  let bonusTokenServiceSpy: any;
  let roomServiceSpy: any;
  let commentServiceSpy: any;
  let translateServiceSpy: any;
  let dialogRefSpy: any;
  let bonusTokenUtilServiceSpy: any;
  let clipboardSpy: any;
  let moderatorServiceSpy: any;
  let routerSpy: any;
  let notificationServiceSpy: any;
  let dialogSpy: any;

  const mockUserId = 'user1';

  beforeEach(async () => {
    // IMPORTANT: Create ALL spies BEFORE TestBed configuration
    bonusTokenServiceSpy = jasmine.createSpyObj('BonusTokenService', [
      'getTokensByUserId',
    ]);
    roomServiceSpy = jasmine.createSpyObj('RoomService', [
      'getRoom',
      'getRoomByShortId',
    ]);
    commentServiceSpy = jasmine.createSpyObj('CommentService', ['getComment']);
    translateServiceSpy = jasmine.createSpyObj(
      'TranslateService',
      ['get', 'instant'],
      { currentLang: 'en' },
    );
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    bonusTokenUtilServiceSpy = jasmine.createSpyObj('BonusTokenUtilService', [
      'setQuestionNumber',
    ]);
    clipboardSpy = jasmine.createSpyObj('Clipboard', ['copy']);
    moderatorServiceSpy = jasmine.createSpyObj('ModeratorService', [
      'get',
      'getUserData',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'show',
    ]);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Configure return values
    bonusTokenServiceSpy.getTokensByUserId.and.returnValue(
      of([] as BonusToken[]),
    );
    moderatorServiceSpy.get.and.returnValue(of([]));
    moderatorServiceSpy.getUserData.and.returnValue(of([]));
    commentServiceSpy.getComment.and.returnValue(of({} as unknown as Comment));
    roomServiceSpy.getRoom.and.returnValue(of({} as Room));
    roomServiceSpy.getRoomByShortId.and.returnValue(of({} as Room));
    translateServiceSpy.get.and.returnValue(of('Translated Text'));
    translateServiceSpy.instant.and.callFake((key) => key);
    bonusTokenUtilServiceSpy.setQuestionNumber.and.returnValue([]);
    dialogSpy.open.and.returnValue({ componentInstance: {} } as any);

    // Create the TestBed configuration
    await TestBed.configureTestingModule({
      declarations: [UserBonusTokenComponent, MockTranslatePipe],
      providers: [
        // Modern HTTP providers
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),

        // Explicitly provide ALL services
        { provide: BonusTokenService, useValue: bonusTokenServiceSpy },
        { provide: RoomService, useValue: roomServiceSpy },
        { provide: CommentService, useValue: commentServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: BonusTokenUtilService, useValue: bonusTokenUtilServiceSpy },
        { provide: ModeratorService, useValue: moderatorServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Clipboard, useValue: clipboardSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserBonusTokenComponent);
    component = fixture.componentInstance;
    component.userId = mockUserId;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should call bonusTokenService on init', () => {
    fixture.detectChanges();
    expect(bonusTokenServiceSpy.getTokensByUserId).toHaveBeenCalledWith(
      mockUserId,
    );
  });
});
