import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterLoginDialogComponent } from './footer-login-dialog.component';

describe('FooterLoginDialogComponent', () => {
  let component: FooterLoginDialogComponent;
  let fixture: ComponentFixture<FooterLoginDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FooterLoginDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterLoginDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
