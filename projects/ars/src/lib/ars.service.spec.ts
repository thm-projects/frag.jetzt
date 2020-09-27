import { TestBed } from '@angular/core/testing';

import { ArsService } from './ars.service';

describe('ArsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ArsService = TestBed.inject(ArsService);
    expect(service).toBeTruthy();
  });
});
