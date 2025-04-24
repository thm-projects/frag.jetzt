import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AppStateService } from 'app/services/state/app-state.service';
import { PrivacyConsentService } from 'app/services/state/privacy-consent.service';
import { EventService } from 'app/services/util/event.service';
import { GptOptInPrivacyComponent } from './gpt-optin-privacy.component';

// Mock implementation for EventService
class MockEventService {
  subscribe() {
    return { unsubscribe: () => {} };
  }
  emit(event: any) {
    // Mock implementation for emit
    console.log('Event emitted:', event);
  }
  get events$() {
    return of({});
  }
}

// Mock implementation for AppStateService
class MockAppStateService {
  language$ = of({ id: 'en' });
}

// Mock implementation for PrivacyConsentService
class MockPrivacyConsentService {
  hasAcceptedPrivacyPolicy() {
    return false;
  }
  acceptPrivacyPolicy() {
    console.log('Privacy policy accepted');
  }
  rejectPrivacyPolicy() {
    console.log('Privacy policy rejected');
  }
}

// Mock implementation for TranslateLoader
class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      'gpt-dialog.title': 'Privacy Notice',
      'gpt-dialog.accept': 'Accept',
      'gpt-dialog.decline': 'Decline',
    });
  }
}

describe('GptOptInPrivacyComponent', () => {
  let component: GptOptInPrivacyComponent;
  let fixture: ComponentFixture<GptOptInPrivacyComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<GptOptInPrivacyComponent>>;
  let mockPrivacyConsentService: MockPrivacyConsentService;

  beforeEach(async () => {
    // Create mocks
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockPrivacyConsentService = new MockPrivacyConsentService();

    // Configure testing module
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader },
        }),
      ],
      declarations: [GptOptInPrivacyComponent],
      providers: [
        // Modern HTTP testing approach
        provideHttpClient(withInterceptorsFromDi()),

        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: AppStateService, useClass: MockAppStateService },
        { provide: PrivacyConsentService, useValue: mockPrivacyConsentService },
        { provide: EventService, useClass: MockEventService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    // Create component and mock its ViewChild element
    fixture = TestBed.createComponent(GptOptInPrivacyComponent);
    component = fixture.componentInstance;
    component.policyContent = {
      nativeElement: {
        scrollHeight: 1000,
        scrollTop: 0,
        clientHeight: 200,
      },
    } as any;

    fixture.detectChanges();
  });

  // Test 1: Component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Test 2: Scroll behavior
  it('should enable accept button when scrolled to end', () => {
    component.policyContent.nativeElement.scrollTop = 800;
    component.onScroll();
    expect(component.hasScrolledToEnd).toBeTrue();
  });

  // Test 3: Accept functionality
  it('should close dialog with true when accepting', () => {
    spyOn(mockPrivacyConsentService, 'acceptPrivacyPolicy');
    component.hasScrolledToEnd = true;
    component.onAccept();
    expect(mockPrivacyConsentService.acceptPrivacyPolicy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  // Test 4: Reject functionality
  it('should close dialog with false when rejecting', () => {
    spyOn(mockPrivacyConsentService, 'rejectPrivacyPolicy');
    component.onReject();
    expect(mockPrivacyConsentService.rejectPrivacyPolicy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
