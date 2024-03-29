import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FrameTestComponent } from './frame-test.component';

describe('FrameTestComponent', () => {
  let component: FrameTestComponent;
  let fixture: ComponentFixture<FrameTestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FrameTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FrameTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
