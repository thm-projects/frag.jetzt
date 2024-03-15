import { TestBed } from '@angular/core/testing';

import { M3DynamicThemeService } from './m3-dynamic-theme.service';

describe('M3DynamicThemeService', () => {
  let service: M3DynamicThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(M3DynamicThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
