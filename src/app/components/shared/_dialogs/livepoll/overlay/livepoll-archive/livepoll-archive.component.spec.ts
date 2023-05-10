import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollArchiveComponent } from './livepoll-archive.component';

describe('LivepollArchiveComponent', () => {
  let component: LivepollArchiveComponent;
  let fixture: ComponentFixture<LivepollArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollArchiveComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
