import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionSelectComponent } from './collection-select.component';

describe('CollectionSelectComponent', () => {
  let component: CollectionSelectComponent;
  let fixture: ComponentFixture<CollectionSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
