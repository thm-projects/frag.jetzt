import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GdprNoticeComponent } from './gdpr-notice.component';

describe('GdprNoticeComponent', () => {
  let component: GdprNoticeComponent;
  let fixture: ComponentFixture<GdprNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GdprNoticeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GdprNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
