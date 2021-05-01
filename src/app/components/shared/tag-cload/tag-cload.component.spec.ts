import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagCloadComponent } from './tag-cload.component';

describe('TagCloadComponent', () => {
  let component: TagCloadComponent;
  let fixture: ComponentFixture<TagCloadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagCloadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagCloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
