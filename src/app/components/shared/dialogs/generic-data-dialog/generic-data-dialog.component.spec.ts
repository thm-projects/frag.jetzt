import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericDataDialogComponent } from './generic-data-dialog.component';

describe('GenericDataDialogComponent', () => {
  let component: GenericDataDialogComponent;
  let fixture: ComponentFixture<GenericDataDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenericDataDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericDataDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
