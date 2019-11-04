import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArsComponent } from './ars.component';

describe('ArsComponent', () => {
  let component: ArsComponent;
  let fixture: ComponentFixture<ArsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
