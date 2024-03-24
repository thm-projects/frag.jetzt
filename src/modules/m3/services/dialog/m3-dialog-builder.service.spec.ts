import { TestBed } from '@angular/core/testing';

import { M3DialogBuilderService } from './m3-dialog-builder.service';

describe('M3DialogBuilderService', () => {
  let service: M3DialogBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(M3DialogBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
