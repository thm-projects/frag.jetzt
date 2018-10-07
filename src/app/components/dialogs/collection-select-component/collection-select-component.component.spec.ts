import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionSelectComponentComponent } from './collection-select-component.component';

describe('CollectionSelectComponentComponent', () => {
  let component: CollectionSelectComponentComponent;
  let fixture: ComponentFixture<CollectionSelectComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionSelectComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionSelectComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
