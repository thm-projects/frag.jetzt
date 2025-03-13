import { TestBed } from '@angular/core/testing';

import { AssistantRestrictionService } from './assistant-restriction.service';

describe('AssistantRestrictionService', () => {
  let service: AssistantRestrictionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantRestrictionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
