import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  TranslateModule,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import { PageNotFoundComponent } from './page-not-found.component';
import { DebugElement } from '@angular/core';
import { Observable, of } from 'rxjs';
import { By } from '@angular/platform-browser';

// Mock translator for testing with minimal translations
class MockTranslator implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({
      'worker-dialog.404-error-description': 'Mocked 404 Description',
    });
  }
}

describe('PageNotFoundComponent', () => {
  let component: PageNotFoundComponent;
  let fixture: ComponentFixture<PageNotFoundComponent>;
  let debugElement: DebugElement;
  let translateService: TranslateService;

  // Setup test environment
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        PageNotFoundComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslator },
        }),
      ],
      providers: [
        provideRouter([]), // Required for RouterLink testing
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    translateService = TestBed.inject(TranslateService);
    translateService.use('en');

    fixture.detectChanges();
  });

  // Test 1: Core component functionality
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Test 2: Main user information (404 indicator)
  it('should display the main 404 heading', () => {
    const heading = debugElement.query(By.css('h2'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent).toContain('404');
  });

  // Test 3: Critical navigation functionality
  it('should provide navigation back to home page', () => {
    const link = debugElement.query(By.css('a.start-button'));
    expect(link).toBeTruthy();
    expect(link.attributes['routerLink']).toBe('/');
    expect(link.nativeElement.textContent).toContain('frag.jetzt');
  });
});
