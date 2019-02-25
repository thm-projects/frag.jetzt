import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewLandingComponent } from './new-landing.component';

describe('NewLandingComponent', () => {
  let component: NewLandingComponent;
  let fixture: ComponentFixture<NewLandingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewLandingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
