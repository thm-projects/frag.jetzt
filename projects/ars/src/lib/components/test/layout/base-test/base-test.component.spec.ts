import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestComponent } from './base-test.component';

describe('BaseTestComponent', () => {
  let component: BaseTestComponent;
  let fixture: ComponentFixture<BaseTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BaseTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
