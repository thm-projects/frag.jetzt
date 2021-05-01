import { TestBed } from '@angular/core/testing';

import { SpacyService } from './spacy.service';

describe('SpacyService', () => {
  let service: SpacyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpacyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
