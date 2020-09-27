import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlexAlignComponent } from './flex-align.component';

describe('FlexAlignComponent', () => {
  let component: FlexAlignComponent;
  let fixture: ComponentFixture<FlexAlignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlexAlignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlexAlignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
