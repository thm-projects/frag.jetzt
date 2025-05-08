import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DataService } from './data-service';
import { Observable, of } from 'rxjs';

describe('DataService', () => {
  let service: DataService;

  // Mock for IndexedDB
  const mockIDBDatabase = {
    close: jasmine.createSpy('close'),
    addEventListener: jasmine.createSpy('addEventListener'),
  };

  const mockIDBOpenDBRequest = {
    result: mockIDBDatabase,
    addEventListener: (event, handler) => {
      if (event === 'success') {
        setTimeout(() => handler({ target: mockIDBOpenDBRequest }), 0);
      }
    },
  };

  beforeEach(() => {
    spyOn(window.indexedDB, 'open').and.returnValue(
      mockIDBOpenDBRequest as any,
    );

    TestBed.configureTestingModule({
      providers: [DataService],
    });
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create data store services', () => {
    expect(service.comment).toBeDefined();
    expect(service.config).toBeDefined();
    expect(service.localRoomSetting).toBeDefined();
    expect(service.moderator).toBeDefined();
    expect(service.motd).toBeDefined();
    expect(service.readMotd).toBeDefined();
    expect(service.roomAccess).toBeDefined();
    expect(service.room).toBeDefined();
  });

  it('should have isBlocked observable', () => {
    const isBlocked$ = service.isBlocked();
    expect(isBlocked$ instanceof Observable).toBeTrue();

    isBlocked$.subscribe((value) => {
      expect(value).toBeDefined();
      expect(typeof value).toBe('boolean');
    });
  });

  it('should have newVersion observable', () => {
    const newVersion$ = service.newVersion();
    expect(newVersion$ instanceof Observable).toBeTrue();
  });

  it('should handle database connection', fakeAsync(() => {
    let connected = false;
    service.database$.subscribe(() => (connected = true));

    tick(100);
    expect(connected).toBeTrue();
    expect(window.indexedDB.open).toHaveBeenCalled();
  }));

  it('should provide access to config store', fakeAsync(() => {
    const mockConfigGet = spyOn(service.config, 'get').and.returnValue(
      of({ key: 'testKey', value: 'testValue' }),
    );

    let result;
    service.config.get('testKey').subscribe((data) => (result = data));

    tick(100);
    expect(mockConfigGet).toHaveBeenCalledWith('testKey');
    expect(result).toEqual({ key: 'testKey', value: 'testValue' });
  }));
});
