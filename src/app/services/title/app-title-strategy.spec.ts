import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppTitleStrategy } from './app-title-strategy';

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let titleService: jasmine.SpyObj<Title>;
  let translateService: jasmine.SpyObj<TranslateService>;

  // Mock router state with a title
  const mockRouterStateSnapshot = {
    root: {
      firstChild: {
        firstChild: null,
        title: 'HOME',
      },
    },
  } as unknown as RouterStateSnapshot;

  beforeEach(() => {
    // Arrange - Create test dependencies
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    const translateSpy = jasmine.createSpyObj('TranslateService', ['get']);
    translateSpy.get.and.returnValue(of('Translated Title'));

    // Mock translation service properties
    Object.defineProperty(translateSpy, 'currentLang', {
      get: () => 'en',
    });
    Object.defineProperty(translateSpy, 'defaultLang', {
      get: () => 'en',
    });
    translateSpy.onLangChange = {
      subscribe: jasmine.createSpy().and.returnValue({ unsubscribe: () => {} }),
    };

    TestBed.configureTestingModule({
      providers: [
        AppTitleStrategy,
        { provide: Title, useValue: titleSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    });

    strategy = TestBed.inject(AppTitleStrategy);
    titleService = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    translateService = TestBed.inject(
      TranslateService,
    ) as jasmine.SpyObj<TranslateService>;
  });

  it('should set page title from route data', () => {
    // Arrange
    translateService.get.and.returnValue(of('Welcome to frag.jetzt'));

    // Act
    strategy.updateTitle(mockRouterStateSnapshot);

    // Assert
    expect(translateService.get).toHaveBeenCalledWith('PAGE_TITLES.HOME');
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'Welcome to frag.jetzt | frag.jetzt',
    );
  });

  it('should use fallback title when translation key not found', () => {
    // Arrange - Setup translation to return the key (indicating no translation)
    translateService.get.and.returnValue(of('PAGE_TITLES.HOME'));

    // Act
    strategy.updateTitle(mockRouterStateSnapshot);

    // Assert - Verify fallback title was used
    expect(titleService.setTitle).toHaveBeenCalled();
    const titleCall = titleService.setTitle.calls.mostRecent();
    expect(titleCall.args[0]).toContain('Where Questions Turn into Answers!');
  });

  it('should handle missing title data gracefully', () => {
    // Arrange - Router state with no title
    const noTitleSnapshot = {
      root: {
        firstChild: {
          firstChild: null,
          // No title property
        },
      },
    } as unknown as RouterStateSnapshot;
    translateService.get.and.returnValue(of('Welcome to frag.jetzt'));

    // Act
    strategy.updateTitle(noTitleSnapshot);

    // Assert - Default title key should be used
    expect(translateService.get).toHaveBeenCalledWith('PAGE_TITLES.HOME');
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'Welcome to frag.jetzt | frag.jetzt',
    );
  });

  it('should use key as fallback when no translation or hardcoded fallback exists', () => {
    // Arrange - Router state with custom title key
    const customKeySnapshot = {
      root: {
        firstChild: {
          firstChild: null,
          title: 'CUSTOM_KEY_WITHOUT_TRANSLATION',
        },
      },
    } as unknown as RouterStateSnapshot;
    translateService.get.and.returnValue(
      of('PAGE_TITLES.CUSTOM_KEY_WITHOUT_TRANSLATION'),
    );

    // Act
    strategy.updateTitle(customKeySnapshot);

    // Assert - Key itself should be used as fallback
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'CUSTOM_KEY_WITHOUT_TRANSLATION | frag.jetzt',
    );
  });

  it('should set temporary dialog title', () => {
    // Arrange - Set initial title
    translateService.get.and.returnValue(of('Welcome to frag.jetzt'));
    strategy.updateTitle(mockRouterStateSnapshot);

    // Reset tracking
    titleService.setTitle.calls.reset();
    translateService.get.calls.reset();

    // Act - Set dialog title
    translateService.get.and.returnValue(of('Privacy Policy'));
    strategy.setDialogTitle('DATA_PROTECTION_DIALOG');

    // Assert - Dialog title should be set
    expect(translateService.get).toHaveBeenCalledWith(
      'PAGE_TITLES.DATA_PROTECTION_DIALOG',
    );
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'Privacy Policy | frag.jetzt',
    );
  });
});
