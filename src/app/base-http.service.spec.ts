import { TestBed, inject } from '@angular/core/testing';

import { BaseHttpService } from './base-http.service';

describe('BaseHttpService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaseHttpService]
    });
  });

  it('should be created', inject([BaseHttpService], (service: BaseHttpService) => {
    expect(service).toBeTruthy();
  }));
});
