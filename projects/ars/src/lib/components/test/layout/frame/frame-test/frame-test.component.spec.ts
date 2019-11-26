import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FrameTestComponent } from './frame-test.component';

describe('FrameTestComponent', () => {
  let component: FrameTestComponent;
  let fixture: ComponentFixture<FrameTestComponent>;

  beforeEach(async(() => {
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
