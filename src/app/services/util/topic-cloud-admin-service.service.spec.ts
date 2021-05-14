import { TestBed } from '@angular/core/testing';

import { TopicCloudAdminServiceService } from './topic-cloud-admin-service.service';

describe('TopicCloudAdminServiceService', () => {
  let service: TopicCloudAdminServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopicCloudAdminServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
