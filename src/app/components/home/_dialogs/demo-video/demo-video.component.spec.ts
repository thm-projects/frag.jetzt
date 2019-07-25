import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoVideoComponent } from './demo-video.component';

describe('DemoVideoComponent', () => {
  let component: DemoVideoComponent;
  let fixture: ComponentFixture<DemoVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DemoVideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
