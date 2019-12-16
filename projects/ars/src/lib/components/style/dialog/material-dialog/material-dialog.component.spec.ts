import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialDialogComponent } from './material-dialog.component';

describe('MaterialDialogComponent', () => {
  let component: MaterialDialogComponent;
  let fixture: ComponentFixture<MaterialDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
