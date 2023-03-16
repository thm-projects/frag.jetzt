import { TestBed } from '@angular/core/testing';

import { LivepollService } from './livepoll.service';

describe('LivepollService', () => {
  let service: LivepollService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivepollService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
