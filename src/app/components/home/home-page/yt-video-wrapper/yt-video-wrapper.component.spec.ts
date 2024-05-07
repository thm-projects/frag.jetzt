import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YtVideoWrapperComponent } from './yt-video-wrapper.component';

describe('YtVideoWrapperComponent', () => {
  let component: YtVideoWrapperComponent;
  let fixture: ComponentFixture<YtVideoWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YtVideoWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(YtVideoWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
