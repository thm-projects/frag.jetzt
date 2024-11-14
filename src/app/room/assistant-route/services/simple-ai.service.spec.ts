import { TestBed } from '@angular/core/testing';

import { SimpleAIService } from './simple-ai.service';

describe('SimpleAIService', () => {
  let service: SimpleAIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimpleAIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
