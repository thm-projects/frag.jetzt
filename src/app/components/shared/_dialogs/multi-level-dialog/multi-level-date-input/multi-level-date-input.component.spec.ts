import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiLevelDateInputComponent } from './multi-level-date-input.component';

describe('MultiLevelDateInputComponent', () => {
  let component: MultiLevelDateInputComponent;
  let fixture: ComponentFixture<MultiLevelDateInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiLevelDateInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiLevelDateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
