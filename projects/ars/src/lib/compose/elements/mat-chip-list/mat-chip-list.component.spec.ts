import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatChipListComponent } from './mat-chip-list.component';

describe('MatChipListComponent', () => {
  let component: MatChipListComponent;
  let fixture: ComponentFixture<MatChipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatChipListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatChipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
