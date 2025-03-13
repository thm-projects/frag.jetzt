import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwDefaultPlaceholderComponent } from './qw-default-placeholder.component';

describe('QwDefaultPlaceholderComponent', () => {
  let component: QwDefaultPlaceholderComponent;
  let fixture: ComponentFixture<QwDefaultPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwDefaultPlaceholderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwDefaultPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
