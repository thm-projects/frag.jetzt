import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogOverlayComponent } from './dialog-overlay.component';

describe('DialogOverlayComponent', () => {
  let component: DialogOverlayComponent;
  let fixture: ComponentFixture<DialogOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
