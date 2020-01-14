import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialBtnComponent } from './material-btn.component';

describe('MaterialBtnComponent', () => {
  let component: MaterialBtnComponent;
  let fixture: ComponentFixture<MaterialBtnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialBtnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
