import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollHeaderComponent } from './livepoll-header.component';

describe('LivepollHeaderComponent', () => {
  let component: LivepollHeaderComponent;
  let fixture: ComponentFixture<LivepollHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
