import { TestBed } from '@angular/core/testing';

import { AssistantThreadService } from './assistant-thread.service';

describe('AssistantThreadService', () => {
  let service: AssistantThreadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantThreadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
