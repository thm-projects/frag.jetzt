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

// Mock TranslateLoader for testing
class FakeLoader implements TranslateLoader {
  // Add underscore to indicate unused parameter and specify return type
  getTranslation(_lang: string): Observable<Record<string, string>> {
    // Provide the specific keys used in the template
    return of({
      'worker-dialog.404-error-description': 'Mocked 404 Description',
      // Add other keys if needed by the template, e.g., button text
      // 'homepage.button.text': 'Go Home' // Example
    });
  }
}

describe('PageNotFoundComponent', () => {
  let component: PageNotFoundComponent;
  let fixture: ComponentFixture<PageNotFoundComponent>;
  let de: DebugElement; // DebugElement for querying the DOM
  // Remove unused nativeElement declaration
  let translateService: TranslateService;

  // Use waitForAsync for async operations like compileComponents
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        PageNotFoundComponent, // Import the standalone component
        TranslateModule.forRoot({
          // Configure TranslateModule for testing
          loader: { provide: TranslateLoader, useClass: FakeLoader },
        }),
      ],
      providers: [
        provideRouter([]), // Provide basic router configuration for RouterLink
      ],
    }).compileComponents(); // Compile template and css
  }));

  // Synchronous setup executed after compilation
  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    // Removed the unused assignment to nativeElement

    // Inject TranslateService and set language explicitly for predictable tests
    translateService = TestBed.inject(TranslateService);
    translateService.use('en'); // Use a specific language

    fixture.detectChanges(); // Trigger initial data binding and render the component
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main 404 heading', () => {
    const heading = de.query(By.css('h2'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent).toContain('404');
  });

  it('should display the translated error description paragraph', () => {
    const paragraph = de.query(By.css('p'));
    expect(paragraph).toBeTruthy();
    // Check against the mocked translation value provided by FakeLoader
    expect(paragraph.nativeElement.textContent).toContain(
      'Mocked 404 Description',
    );
  });

  it('should contain a link pointing to the root path ("/") with correct text', () => {
    const link = de.query(By.css('a.start-button'));
    expect(link).toBeTruthy();
    // Check the routerLink attribute directly
    expect(link.attributes['routerLink']).toBe('/');
    // Check the visible text of the link
    expect(link.nativeElement.textContent).toContain('frag.jetzt');
  });

  it('should display exactly two robot images with correct alt text', () => {
    // Use queryAll to find multiple elements
    const images = de.queryAll(By.css('img.robot-img'));
    expect(images.length).toBe(2); // Verify exactly two images are found

    // Check the first image
    expect(images[0]).toBeTruthy();
    expect(images[0].attributes['alt']).toBe('Chatbot zeigt nach unten');

    // Check the second image
    expect(images[1]).toBeTruthy();
    expect(images[1].attributes['alt']).toBe(
      'Chatbot zeigt nach links (Landscape)',
    );
  });
});
