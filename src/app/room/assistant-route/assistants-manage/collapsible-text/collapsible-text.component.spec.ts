import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollapsibleTextComponent } from './collapsible-text.component';

describe('CollapsibleTextComponent', () => {
  let component: CollapsibleTextComponent;
  let fixture: ComponentFixture<CollapsibleTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapsibleTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollapsibleTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
