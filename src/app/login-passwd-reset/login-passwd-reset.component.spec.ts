import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPasswdResetComponent } from './login-passwd-reset.component';

describe('LoginPasswdResetComponent', () => {
  let component: LoginPasswdResetComponent;
  let fixture: ComponentFixture<LoginPasswdResetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginPasswdResetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPasswdResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
