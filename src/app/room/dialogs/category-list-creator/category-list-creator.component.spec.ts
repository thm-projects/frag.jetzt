import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryListCreatorComponent } from './category-list-creator.component';

describe('CategoryListCreatorComponent', () => {
  let component: CategoryListCreatorComponent;
  let fixture: ComponentFixture<CategoryListCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryListCreatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
