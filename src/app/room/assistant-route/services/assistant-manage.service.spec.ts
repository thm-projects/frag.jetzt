import { TestBed } from '@angular/core/testing';

import { AssistantManageService } from './assistant-manage.service';

describe('AssistantManageService', () => {
  let service: AssistantManageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantManageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
