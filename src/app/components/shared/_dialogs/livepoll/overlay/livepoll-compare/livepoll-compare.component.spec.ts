import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollCompareComponent } from './livepoll-compare.component';

describe('LivepollCompareComponent', () => {
  let component: LivepollCompareComponent;
  let fixture: ComponentFixture<LivepollCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollCompareComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
