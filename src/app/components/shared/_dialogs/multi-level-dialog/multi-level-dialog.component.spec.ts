import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiLevelDialogComponent } from './multi-level-dialog.component';

describe('MultiLevelDialogComponent', () => {
  let component: MultiLevelDialogComponent;
  let fixture: ComponentFixture<MultiLevelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiLevelDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiLevelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
