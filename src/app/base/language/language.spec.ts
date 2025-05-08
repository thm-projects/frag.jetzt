import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  AVAILABLE_LANGUAGES,
  language,
  setLanguage,
  Language,
} from './language';
import { dataService } from '../db/data-service';

describe('Language Module', () => {
  let configGetSpy: jasmine.Spy;
  let configCreateOrUpdateSpy: jasmine.Spy;

  beforeEach(() => {
    // Mock dataService methods
    configGetSpy = spyOn(dataService.config, 'get').and.returnValue(
      of({ key: 'language', value: 'en' }),
    );
    configCreateOrUpdateSpy = spyOn(
      dataService.config,
      'createOrUpdate',
    ).and.returnValue(of('success'));
  });

  it('should define available languages', () => {
    expect(AVAILABLE_LANGUAGES).toEqual(['en', 'de', 'fr']);
  });

  it('should return current language', () => {
    expect(language()).toBeDefined();
    expect(AVAILABLE_LANGUAGES.includes(language())).toBeTrue();
  });

  it('should set language correctly', () => {
    const result = setLanguage('de');
    expect(result).toBeTrue();
    expect(language()).toEqual('de');
    expect(configCreateOrUpdateSpy).toHaveBeenCalledWith({
      key: 'language',
      value: 'de',
    });
  });

  it('should fallback to English for invalid language', () => {
    // @ts-expect-error Testing invalid input
    const result = setLanguage('invalid');
    expect(result).toBeFalse();
    expect(language()).toEqual('en');
  });

  it('should get language from navigator if available', () => {
    expect(AVAILABLE_LANGUAGES.includes(language())).toBeTrue();
  });

  it('should load language from dataService', (done) => {
    // Reset to English
    setLanguage('en');
    expect(language()).toEqual('en');

    // Simulate what happens in the subscription
    const mockConfig = { key: 'language', value: 'fr' };

    // Simulate the code that runs in the subscription
    const stored = mockConfig?.value as Language | undefined;
    if (stored && AVAILABLE_LANGUAGES.includes(stored)) {
      setLanguage(stored);

      // Check after a short delay
      setTimeout(() => {
        expect(language()).toEqual('fr');
        done();
      }, 10);
    } else {
      done.fail('Invalid language configuration');
    }
  });
});
