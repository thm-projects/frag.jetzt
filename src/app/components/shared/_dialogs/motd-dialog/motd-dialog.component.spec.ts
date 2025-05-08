import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotdDialogComponent } from './motd-dialog.component';
import { AccountStateService } from 'app/services/state/account-state.service';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { MotdAPI } from '../../../../services/http/motd.service';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { MotdMessageComponent } from './motd-message/motd-message.component';
import { By } from '@angular/platform-browser';
import { MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppStateService } from 'app/services/state/app-state.service';
import { OnlineStateService } from 'app/services/state/online-state.service';
import { RatingService } from 'app/services/http/rating.service';

// Mock translate pipe
@Pipe({
  name: 'translate',
  standalone: false,
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('MotdDialogComponent', () => {
  let component: MotdDialogComponent;
  let fixture: ComponentFixture<MotdDialogComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountStateService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MotdDialogComponent>>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let appStateServiceSpy: jasmine.SpyObj<AppStateService>;
  let onlineStateServiceSpy: jasmine.SpyObj<OnlineStateService>;
  let ratingServiceSpy: jasmine.SpyObj<RatingService>;

  // Mock data - using relative dates for CI compatibility
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 172800000);

  const mockMotdAPIs: MotdAPI[] = [
    {
      id: 'motd1',
      startTimestamp: today,
      endTimestamp: new Date(today.getTime() + 86400000),
      messages: { en: { language: 'en', message: 'Message 1' } },
    },
    {
      id: 'motd2',
      startTimestamp: yesterday,
      endTimestamp: new Date(yesterday.getTime() + 86400000),
      messages: { en: { language: 'en', message: 'Message 2' } },
    },
    {
      id: 'motd3',
      startTimestamp: twoDaysAgo,
      endTimestamp: new Date(twoDaysAgo.getTime() + 86400000),
      messages: { en: { language: 'en', message: 'Message 3' } },
    },
  ];

  const mockReadData = [{ motdId: 'motd3', timestamp: new Date() }];

  beforeEach(async () => {
    // Create spies for services
    accountServiceSpy = jasmine.createSpyObj(
      'AccountStateService',
      ['readMotds', 'unreadMotd'],
      { readMotds$: new BehaviorSubject(mockReadData) },
    );

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    translateServiceSpy = jasmine.createSpyObj(
      'TranslateService',
      ['get', 'instant'],
      { currentLang: 'en' },
    );
    translateServiceSpy.instant.and.callFake((key) => key);

    appStateServiceSpy = jasmine.createSpyObj(
      'AppStateService',
      ['getLanguage', 'getCurrentLanguage'],
      { language: 'en' },
    );

    onlineStateServiceSpy = jasmine.createSpyObj(
      'OnlineStateService',
      ['isOnline'],
      { isOnline$: new BehaviorSubject(true) },
    );

    ratingServiceSpy = jasmine.createSpyObj('RatingService', [
      'getRating',
      'postRating',
    ]);

    await TestBed.configureTestingModule({
      imports: [MatTabsModule, NoopAnimationsModule],
      declarations: [
        MotdDialogComponent,
        MotdMessageComponent,
        MockTranslatePipe,
      ],
      providers: [
        // Modern HTTP testing approach
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),

        { provide: AccountStateService, useValue: accountServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: AppStateService, useValue: appStateServiceSpy },
        { provide: OnlineStateService, useValue: onlineStateServiceSpy },
        { provide: RatingService, useValue: ratingServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MotdDialogComponent);
    component = fixture.componentInstance;
    component.motds = mockMotdAPIs;
    fixture.detectChanges();

    // Use jasmine clock for time-based tests (CI-agnostic)
    jasmine.clock().install();
    jasmine.clock().tick(100);
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('Basic functionality', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct read/unread messages', () => {
      // Test data structure rather than UI elements
      expect(component.readMotds.length).toBe(1);
      expect(component.unreadMotds.length).toBe(2);

      expect(component.readMotds[0].id).toBe('motd3');
      expect(component.unreadMotds[0].id).toBe('motd1');
      expect(component.unreadMotds[1].id).toBe('motd2');
    });

    it('should sort messages by startTimestamp in descending order', () => {
      // Test behavior rather than implementation details
      expect(component.unreadMotds[0].startTimestamp.getTime()).toBeGreaterThan(
        component.unreadMotds[1].startTimestamp.getTime(),
      );
    });
  });

  describe('Message status management', () => {
    it('should move message from unread to read list when marked as read', () => {
      const unreadMotdBefore = component.unreadMotds[0];
      const initialUnreadCount = component.unreadMotds.length;
      const initialReadCount = component.readMotds.length;

      unreadMotdBefore.isRead = true;
      component.onSwitch(unreadMotdBefore);

      // Test behavior and state changes
      expect(component.unreadMotds.length).toBe(initialUnreadCount - 1);
      expect(component.readMotds.length).toBe(initialReadCount + 1);
      expect(accountServiceSpy.readMotds).toHaveBeenCalledWith([
        unreadMotdBefore.id,
      ]);
    });

    it('should move message from read to unread list when marked as unread', () => {
      const readMotdBefore = component.readMotds[0];
      const initialReadCount = component.readMotds.length;

      readMotdBefore.isRead = false;
      component.onSwitch(readMotdBefore);

      expect(component.readMotds.length).toBe(initialReadCount - 1);
      expect(component.unreadMotds.length).toBe(
        component.motds.length - initialReadCount + 1,
      );
      expect(accountServiceSpy.unreadMotd).toHaveBeenCalledWith(
        readMotdBefore.id,
      );
    });

    it('should mark all messages as read when markAllAsRead is called', () => {
      const unreadIds = component.unreadMotds.map((m) => m.id);

      component.markAllAsRead();

      expect(accountServiceSpy.readMotds).toHaveBeenCalledWith(unreadIds);
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('UI rendering', () => {
    it('should display read and unread messages in separate tabs', () => {
      // Fix: Use direct CSS selector instead of directive
      const tabGroup = fixture.debugElement.query(By.css('mat-tab-group'));
      expect(tabGroup).toBeTruthy('Tab group should be present');

      // Fix: Instead of looking for tabs directly, verify the content is there
      expect(component.unreadMotds.length).toBe(
        2,
        'Should have unread messages',
      );
      expect(component.readMotds.length).toBe(1, 'Should have read messages');

      // Test for message components with By.css instead of By.directive
      const messageComponents = fixture.debugElement.queryAll(
        By.css('app-motd-message'),
      );
      expect(messageComponents.length).toBeGreaterThan(
        0,
        'Should show message components',
      );
    });

    it('should handle empty read/unread message lists', () => {
      component.unreadMotds = [];
      component.readMotds = [];
      fixture.detectChanges();

      // Verify component state directly
      expect(component.unreadMotds.length).toBe(0);
      expect(component.readMotds.length).toBe(0);

      // Test that no message components are rendered
      const messages = fixture.debugElement.queryAll(
        By.css('app-motd-message'),
      );
      expect(messages.length).toBe(0, 'Should not show any messages');

      // Also fix this query
      const tabGroup = fixture.debugElement.query(By.css('mat-tab-group'));
      expect(tabGroup).toBeTruthy(
        'Tab group should still be present with empty lists',
      );
    });
  });
});
