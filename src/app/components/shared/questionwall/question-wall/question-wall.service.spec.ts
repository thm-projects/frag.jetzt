import { TestBed } from '@angular/core/testing';

import { QuestionWallService } from './question-wall.service';

describe('QuestionWallService', () => {
  let service: QuestionWallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionWallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
