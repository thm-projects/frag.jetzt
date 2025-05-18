import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { PwaInstallSnackbarComponent } from './pwa-install-snackbar.component';
import { PwaService } from 'app/services/util/pwa-installation.service';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { By, DomSanitizer } from '@angular/platform-browser';
import { of, NEVER } from 'rxjs';
import { MatIconRegistry } from '@angular/material/icon';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('PwaInstallSnackbarComponent', () => {
  let component: PwaInstallSnackbarComponent;
  let fixture: ComponentFixture<PwaInstallSnackbarComponent>;
  let pwaService: jasmine.SpyObj<PwaService>;
  let snackBarRef: jasmine.SpyObj<MatSnackBarRef<PwaInstallSnackbarComponent>>;
  let localStorage: any;

  // Mock i18n data
  const mockI18n = {
    installPrompt: 'Erlebe frag.jetzt besser als App!',
    installButton: 'Installieren',
    laterButton: 'Später',
  };

  beforeEach(async () => {
    // Setup service spies
    pwaService = jasmine.createSpyObj('PwaService', [
      'triggerInstallPrompt',
      'dismissInstall',
    ]);
    snackBarRef = jasmine.createSpyObj('MatSnackBarRef', [
      'dismiss',
      'afterDismissed',
    ]);
    snackBarRef.afterDismissed.and.returnValue(
      of({ dismissedByAction: false }),
    );

    // Mock localStorage
    localStorage = {};
    spyOn(window.localStorage, 'getItem').and.callFake(
      (key) => localStorage[key] ?? null,
    );
    spyOn(window.localStorage, 'setItem').and.callFake(
      (key, value) => (localStorage[key] = value),
    );
    spyOn(window.localStorage, 'removeItem').and.callFake(
      (key) => delete localStorage[key],
    );

    // Create DOM sanitizer mock
    const domSanitizerMock = {
      sanitize: (context: any, value: any) => value,
      bypassSecurityTrustHtml: (value: string) => value,
      bypassSecurityTrustStyle: (value: string) => value,
      bypassSecurityTrustScript: (value: string) => value,
      bypassSecurityTrustUrl: (value: string) => value,
      bypassSecurityTrustResourceUrl: (value: string) => value,
    };

    await TestBed.configureTestingModule({
      imports: [PwaInstallSnackbarComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        { provide: MatSnackBarRef, useValue: snackBarRef },
        { provide: PwaService, useValue: pwaService },
        { provide: DomSanitizer, useValue: domSanitizerMock },
      ],
    }).compileComponents();

    // Mock icon registry to prevent SVG loading issues
    const iconRegistrySpy = TestBed.inject(MatIconRegistry);
    spyOn(iconRegistrySpy, 'getNamedSvgIcon').and.returnValue(NEVER);
    spyOn(iconRegistrySpy, 'addSvgIcon').and.stub();

    fixture = TestBed.createComponent(PwaInstallSnackbarComponent);
    component = fixture.componentInstance;

    // Mock i18n function
    (component as any).i18n = () => mockI18n;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show correct text content in German', () => {
    fixture.detectChanges();

    const contentElement = fixture.debugElement.query(
      By.css('.pwa-snackbar-content span'),
    );
    const installButtonElement = fixture.debugElement.query(
      By.css('button:first-child'),
    );
    const laterButtonElement = fixture.debugElement.query(
      By.css('.later-button'),
    );

    expect(contentElement?.nativeElement.textContent).toBe(
      'Erlebe frag.jetzt besser als App!',
    );
    expect(installButtonElement?.nativeElement.textContent.trim()).toBe(
      'Installieren',
    );
    expect(laterButtonElement?.nativeElement.textContent.trim()).toBe('Später');
  });

  it('should call install method when install button is clicked', () => {
    const installButton = fixture.debugElement.query(
      By.css('button:first-child'),
    );
    pwaService.triggerInstallPrompt.and.returnValue(Promise.resolve());

    installButton.nativeElement.click();
    fixture.detectChanges();

    expect(pwaService.triggerInstallPrompt).toHaveBeenCalled();
  });

  it('should call dismiss method when later button is clicked', () => {
    const laterButton = fixture.debugElement.query(By.css('.later-button'));

    laterButton.nativeElement.click();
    fixture.detectChanges();

    expect(pwaService.dismissInstall).toHaveBeenCalled();
  });

  it('should save timestamp to localStorage when later is clicked', fakeAsync(() => {
    spyOn(Date, 'now').and.returnValue(1234567890);

    pwaService.dismissInstall.and.callFake((rememberChoice: boolean) => {
      if (!rememberChoice) {
        localStorage['fj-pwa-last-prompt-time'] = Date.now().toString();
      }
    });

    const laterButton = fixture.debugElement.query(By.css('.later-button'));
    laterButton.nativeElement.click();

    tick();
    expect(localStorage['fj-pwa-last-prompt-time']).toBe('1234567890');
  }));

  it('should respect the delay after clicking later', fakeAsync(() => {
    const mockSnackBar = jasmine.createSpyObj('MatSnackBar', [
      'openFromComponent',
    ]);
    const mockService = new PwaService(mockSnackBar);
    const privateMethods = mockService as any;
    spyOn(privateMethods, 'isAppInstalled').and.returnValue(false);

    // Set recent timestamp
    localStorage['fj-pwa-last-prompt-time'] = Date.now().toString();

    // Check prompt should not show initially
    const shouldShow = privateMethods.shouldShowInstallPrompt();
    expect(shouldShow).toBeFalse();

    // Fast-forward 31 minutes
    const futureTime = Date.now() + 31 * 60 * 1000;
    spyOn(Date, 'now').and.returnValue(futureTime);

    // Now prompt should be allowed
    const shouldShowLater = privateMethods.shouldShowInstallPrompt();
    expect(shouldShowLater).toBeTrue();
  }));

  it('should permanently dismiss when requested', () => {
    pwaService.dismissInstall.and.callFake((rememberChoice: boolean) => {
      if (rememberChoice) {
        localStorage['pwa-install-dismissed'] = 'true';
      }
    });

    component.dismiss();
    expect(pwaService.dismissInstall).toHaveBeenCalled();
  });
});
