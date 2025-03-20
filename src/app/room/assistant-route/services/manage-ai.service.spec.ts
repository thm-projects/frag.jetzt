import { TestBed } from '@angular/core/testing';

import { ManageAiService } from './manage-ai.service';

describe('ManageAiService', () => {
  let service: ManageAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
