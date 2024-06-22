import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwTopBarComponent } from './qw-top-bar.component';

describe('QwTopBarComponent', () => {
  let component: QwTopBarComponent;
  let fixture: ComponentFixture<QwTopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwTopBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwTopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
