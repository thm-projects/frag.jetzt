import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBoxContentComponent } from './dialog-box-content.component';

describe('DialogBoxContentTemplateComponent', () => {
  let component: DialogBoxContentComponent;
  let fixture: ComponentFixture<DialogBoxContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogBoxContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogBoxContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
