import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwBottomBarComponent } from './qw-bottom-bar.component';

describe('QwBottomBarComponent', () => {
  let component: QwBottomBarComponent;
  let fixture: ComponentFixture<QwBottomBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwBottomBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwBottomBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
