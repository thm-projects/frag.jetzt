import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppTitleStrategy } from './app-title-strategy';
import { of, Subject } from 'rxjs';

describe('AppTitleStrategy', () => {
  let titleStrategy: AppTitleStrategy;
  let titleService: jasmine.SpyObj<Title>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let langChangeSubject: Subject<{ lang: string }>;

  // Helper function to create mock router state
  function createMockRouterState(
    titleKey: string | null = 'HOME',
  ): RouterStateSnapshot {
    return {
      root: {
        firstChild: {
          data: titleKey ? { title: titleKey } : {},
        },
      },
    } as unknown as RouterStateSnapshot;
  }

  beforeEach(() => {
    // Arrange: Create mocks and spies
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    langChangeSubject = new Subject<{ lang: string }>();

    const translateSpy = jasmine.createSpyObj(
      'TranslateService',
      ['get', 'use'],
      {
        currentLang: 'en',
        defaultLang: 'en',
        onLangChange: langChangeSubject.asObservable(),
      },
    );

    // Mock different translation responses based on key
    translateSpy.get.and.callFake((key: string) => {
      if (key === 'PAGE_TITLES.HOME') {
        return of('Translated Title');
      } else {
        // Simulate not found by returning the key
        return of(key);
      }
    });

    TestBed.configureTestingModule({
      providers: [
        AppTitleStrategy,
        { provide: Title, useValue: titleSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    });

    titleStrategy = TestBed.inject(AppTitleStrategy);
    titleService = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    translateService = TestBed.inject(
      TranslateService,
    ) as jasmine.SpyObj<TranslateService>;

    // Mock buildTitle method that normally comes from the base class
    spyOn(titleStrategy, 'buildTitle').and.callFake(
      (state: RouterStateSnapshot) => {
        return state.root.firstChild?.data?.['title'] || null;
      },
    );
  });

  // Test 1: Basic functionality - translation found
  it('should set the page title using translation service', fakeAsync(() => {
    // Arrange
    const mockRouterState = createMockRouterState();

    // Act
    titleStrategy.updateTitle(mockRouterState);
    tick(); // Process async operations

    // Assert
    expect(translateService.get).toHaveBeenCalledWith('PAGE_TITLES.HOME');
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'Translated Title | frag.jetzt',
    );
  }));

  // Test 2: Fallback behavior - translation not found
  it('should use fallback title when translation key is not found', fakeAsync(() => {
    // Arrange
    const mockRouterState = createMockRouterState();
    translateService.get.and.returnValue(of('PAGE_TITLES.HOME'));

    // Act
    titleStrategy.updateTitle(mockRouterState);
    tick();

    // Assert
    expect(titleService.setTitle).toHaveBeenCalledWith('Home | frag.jetzt');
  }));

  // Test 3: Reactive behavior on language change
  it('should update title when language changes', fakeAsync(() => {
    // Arrange
    const mockRouterState = createMockRouterState();

    // Act 1 - Set title in English
    titleStrategy.updateTitle(mockRouterState);
    tick();

    // Reset spies for clean test
    titleService.setTitle.calls.reset();
    translateService.get.calls.reset();

    // Act 2 - Change language to German
    Object.defineProperty(translateService, 'currentLang', { get: () => 'de' });
    langChangeSubject.next({ lang: 'de' });
    tick();

    // Assert
    expect(translateService.get).toHaveBeenCalledWith('PAGE_TITLES.HOME');
    expect(titleService.setTitle).toHaveBeenCalled();
  }));

  // Test 4: Error tolerance - Missing title in route data
  it('should handle missing title data gracefully', fakeAsync(() => {
    // Arrange
    const mockRouterStateWithoutTitle = createMockRouterState(null);

    // Act
    titleStrategy.updateTitle(mockRouterStateWithoutTitle);
    tick();

    // Assert
    expect(titleService.setTitle).toHaveBeenCalledWith('frag.jetzt');
  }));

  // Test 5: Fallback for completely unsupported keys
  it('should use route key as fallback when no translation or fallback exists', fakeAsync(() => {
    // Arrange - Key not available in any language
    Object.defineProperty(translateService, 'currentLang', { get: () => 'fr' });
    const mockRouterState = createMockRouterState('UNKNOWN_KEY');

    // Act
    titleStrategy.updateTitle(mockRouterState);
    tick();

    // Assert
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'UNKNOWN_KEY | frag.jetzt',
    );
  }));

  // Test 6: Fallback for languages without specific translations
  it('should use English fallback when language has no translations', fakeAsync(() => {
    // Arrange - French has no entries
    Object.defineProperty(translateService, 'currentLang', { get: () => 'fr' });

    const fallbackTitles = {
      en: {
        SPECIAL_KEY: 'English Fallback Text',
      },
      fr: {},
    };

    Object.defineProperty(titleStrategy, 'fallbackTitles', {
      value: fallbackTitles,
    });
    const mockRouterState = createMockRouterState('SPECIAL_KEY');

    // Act
    titleStrategy.updateTitle(mockRouterState);
    tick();

    // Assert
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'English Fallback Text | frag.jetzt',
    );
  }));

  // Test 7: English fallback for specific missing keys in other languages
  it('should use English fallback when key exists in English but not in current language', fakeAsync(() => {
    // Arrange - German doesn't have the key, but English does
    Object.defineProperty(translateService, 'currentLang', { get: () => 'de' });

    // Create a scenario where:
    // 1. The 'de' language exists
    // 2. The key doesn't exist in 'de'
    // 3. The key exists in 'en'
    const fallbackTitles = {
      en: {
        ENGLISH_ONLY_KEY: 'English Text',
      },
      de: {
        SOME_OTHER_KEY: 'German Text', // Key exists in German, but not the one we're looking for
      },
    };

    // Use Reflection to set the private fallbackTitles property
    Object.defineProperty(titleStrategy, 'fallbackTitles', {
      value: fallbackTitles,
    });

    const mockRouterState = createMockRouterState('ENGLISH_ONLY_KEY');

    // Act
    titleStrategy.updateTitle(mockRouterState);
    tick();

    // Assert
    // Should use the English fallback since it's not available in German
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'English Text | frag.jetzt',
    );
  }));
});
