import { TestBed } from '@angular/core/testing';

import { AssistantFileService } from './assistant-file.service';

describe('AssistantFileService', () => {
  let service: AssistantFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
