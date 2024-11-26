import { TestBed } from '@angular/core/testing';

import { AssistantAPIService } from './assistant-api.service';

describe('AssistantAPIService', () => {
  let service: AssistantAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
