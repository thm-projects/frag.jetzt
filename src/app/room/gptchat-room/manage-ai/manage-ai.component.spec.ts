import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAiComponent } from './manage-ai.component';

describe('ManageAiComponent', () => {
  let component: ManageAiComponent;
  let fixture: ComponentFixture<ManageAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageAiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageAiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
