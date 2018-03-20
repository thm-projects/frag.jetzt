import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentCreateComponent } from './content-create.component';

describe('ContentCreateComponent', () => {
  let component: ContentCreateComponent;
  let fixture: ComponentFixture<ContentCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
