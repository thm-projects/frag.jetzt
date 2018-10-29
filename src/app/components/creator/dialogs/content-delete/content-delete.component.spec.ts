import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentDeleteComponent } from './content-delete.component';

describe('ContentDeleteComponent', () => {
  let component: ContentDeleteComponent;
  let fixture: ComponentFixture<ContentDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
