import { TestBed } from '@angular/core/testing';

import { TextDialogService } from './text-dialog.service';

describe('TextDialogService', () => {
  let service: TextDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
