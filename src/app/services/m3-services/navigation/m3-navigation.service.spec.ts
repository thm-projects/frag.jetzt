import { TestBed } from '@angular/core/testing';

import { M3NavigationService } from './m3-navigation.service';

describe('M3NavigationService', () => {
  let service: M3NavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(M3NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
